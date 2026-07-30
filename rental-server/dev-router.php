<?php
declare(strict_types=1);

$path = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
$documentRoot = rtrim((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''), DIRECTORY_SEPARATOR);

if ($path === '/api/chat') {
    require $documentRoot . DIRECTORY_SEPARATOR . 'api' . DIRECTORY_SEPARATOR . 'chat.php';
    return true;
}

if ($path === '/api/health') {
    require $documentRoot . DIRECTORY_SEPARATOR . 'api' . DIRECTORY_SEPARATOR . 'health.php';
    return true;
}

return false;
