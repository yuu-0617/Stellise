<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    header('Allow: GET');
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$documentRoot = rtrim((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''), DIRECTORY_SEPARATOR);
$defaultPath = $documentRoot !== ''
    ? dirname($documentRoot) . DIRECTORY_SEPARATOR . 'stellise-secrets.php'
    : '';
$configPath = (string) (getenv('STELLISE_CONFIG_PATH') ?: $defaultPath);
$configured = getenv('GEMINI_API_KEY') !== false && getenv('GEMINI_API_KEY') !== '';
if (!$configured && $configPath !== '' && is_file($configPath)) {
    $config = require $configPath;
    $configured = is_array($config) && !empty($config['gemini_api_key']);
}

echo json_encode(['ok' => true, 'chatbotConfigured' => $configured]);
