<?php
declare(strict_types=1);

const LINE_SUPPORT_URL = 'https://lin.ee/pzygyU4';
const MAX_BODY_BYTES = 16384;
const RATE_LIMIT = 15;
const RATE_WINDOW_SECONDS = 600;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-Frame-Options: DENY');

function respond(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fallback(string $message = '現在AIサポートに接続できません。LINEサポートへご相談ください。'): array
{
    return [
        'answer' => $message,
        'resolved' => false,
        'escalationUrl' => LINE_SUPPORT_URL,
    ];
}

function client_address(): string
{
    return (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
}

function is_rate_limited(string $address): bool
{
    $file = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
        . DIRECTORY_SEPARATOR
        . 'stellise-support-'
        . hash('sha256', $address)
        . '.json';
    $handle = @fopen($file, 'c+');
    if ($handle === false || !flock($handle, LOCK_EX)) {
        if (is_resource($handle)) {
            fclose($handle);
        }
        return false;
    }

    $raw = stream_get_contents($handle);
    $decoded = json_decode($raw ?: '[]', true);
    $now = time();
    $recent = [];
    if (is_array($decoded)) {
        foreach ($decoded as $stamp) {
            if (is_int($stamp) && $now - $stamp < RATE_WINDOW_SECONDS) {
                $recent[] = $stamp;
            }
        }
    }

    $limited = count($recent) >= RATE_LIMIT;
    if (!$limited) {
        $recent[] = $now;
    }
    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode($recent));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
    return $limited;
}

function load_runtime_config(): array
{
    $documentRoot = rtrim((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''), DIRECTORY_SEPARATOR);
    $defaultPath = $documentRoot !== ''
        ? dirname($documentRoot) . DIRECTORY_SEPARATOR . 'stellise-secrets.php'
        : '';
    $configPath = (string) (getenv('STELLISE_CONFIG_PATH') ?: $defaultPath);
    $fileConfig = [];
    if ($configPath !== '' && is_file($configPath)) {
        $loaded = require $configPath;
        if (is_array($loaded)) {
            $fileConfig = $loaded;
        }
    }

    return [
        'api_key' => (string) (getenv('GEMINI_API_KEY') ?: ($fileConfig['gemini_api_key'] ?? '')),
        'model' => (string) (getenv('SUPPORT_GEMINI_MODEL') ?: ($fileConfig['gemini_model'] ?? 'gemini-3.5-flash-lite')),
    ];
}

function safe_history(mixed $history): array
{
    if (!is_array($history)) {
        return [];
    }
    $safe = [];
    foreach (array_slice($history, -6) as $item) {
        if (!is_array($item) || !in_array($item['role'] ?? '', ['user', 'assistant'], true)) {
            continue;
        }
        $content = trim((string) ($item['content'] ?? ''));
        if ($content === '') {
            continue;
        }
        $safe[] = [
            'role' => $item['role'],
            'content' => mb_substr($content, 0, 500),
        ];
    }
    return $safe;
}

function ask_gemini(string $question, mixed $history, string $manual, array $config): array
{
    if ($config['api_key'] === '') {
        return fallback();
    }
    if (!function_exists('curl_init')) {
        throw new RuntimeException('PHP cURL extension is unavailable');
    }

    $prompt = "You are the official support assistant for Stellise. "
        . "Answer in natural, concise Japanese using only the support manual below. "
        . "Never guess. If the manual cannot fully answer the question, set resolved to false "
        . "and recommend LINE support. Return JSON only: "
        . '{"answer":"...","resolved":true or false}'
        . "\n\n<manual>\n{$manual}\n</manual>\n\nRecent conversation:\n"
        . json_encode(safe_history($history), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        . "\n\nQuestion:\n{$question}";

    $endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/'
        . rawurlencode($config['model'])
        . ':generateContent';
    $requestBody = json_encode([
        'contents' => [[
            'role' => 'user',
            'parts' => [['text' => $prompt]],
        ]],
        'generationConfig' => ['responseMimeType' => 'application/json'],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $curl = curl_init($endpoint);
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'x-goog-api-key: ' . $config['api_key'],
        ],
        CURLOPT_POSTFIELDS => $requestBody,
    ]);
    $rawResponse = curl_exec($curl);
    $curlError = curl_error($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);

    if ($rawResponse === false || $status < 200 || $status >= 300) {
        throw new RuntimeException($curlError !== '' ? $curlError : "Gemini returned {$status}");
    }
    $result = json_decode($rawResponse, true, 512, JSON_THROW_ON_ERROR);
    $text = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';
    if (!is_string($text) || trim($text) === '') {
        throw new RuntimeException('Gemini returned an empty response');
    }
    $parsed = json_decode($text, true, 512, JSON_THROW_ON_ERROR);
    $answer = trim((string) ($parsed['answer'] ?? ''));
    if ($answer === '') {
        throw new RuntimeException('Gemini returned an empty answer');
    }
    $resolved = ($parsed['resolved'] ?? false) === true;
    return [
        'answer' => mb_substr($answer, 0, 800),
        'resolved' => $resolved,
        'escalationUrl' => $resolved ? null : LINE_SUPPORT_URL,
    ];
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['error' => 'Method not allowed']);
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > MAX_BODY_BYTES) {
    respond(413, ['error' => 'リクエストが大きすぎます。']);
}
if (is_rate_limited(client_address())) {
    respond(429, fallback('少し時間をおいてから、もう一度お試しください。'));
}

try {
    $rawBody = file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1);
    if ($rawBody === false || strlen($rawBody) > MAX_BODY_BYTES) {
        respond(413, ['error' => 'リクエストが大きすぎます。']);
    }
    $body = json_decode($rawBody, true, 32, JSON_THROW_ON_ERROR);
    if (!is_array($body)) {
        respond(400, ['error' => 'JSONオブジェクトを送信してください。']);
    }
    $question = trim((string) ($body['question'] ?? ''));
    if ($question === '' || mb_strlen($question) > 500) {
        respond(400, ['error' => '質問は1〜500文字で入力してください。']);
    }
    $manualPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'support-manual.md';
    $manual = file_get_contents($manualPath);
    if ($manual === false) {
        throw new RuntimeException('Support manual is unavailable');
    }
    respond(200, ask_gemini($question, $body['history'] ?? [], $manual, load_runtime_config()));
} catch (Throwable $error) {
    error_log('Stellise ChatBot: ' . $error->getMessage());
    respond(503, fallback());
}
