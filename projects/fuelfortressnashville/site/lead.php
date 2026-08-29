<?php
// lead.php — Fuel Fortress Nashville lead handler.
// Swap LEAD_TO for the branded address when the client issues it.
const LEAD_TO = 'fuelfortress615@gmail.com';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }
if (!empty($_POST['website'])) { exit; }            // honeypot

$body = "New website lead — fuelfortressnashville.com\n\n";
foreach (['first', 'last', 'email', 'phone', 'interest'] as $f) {
    $body .= ucfirst($f) . ': ' . substr(strip_tags($_POST[$f] ?? ''), 0, 200) . "\n";
}
$body .= "\nReceived: " . date('c') . "\n";

mail(LEAD_TO, 'Website lead — Fuel Fortress Nashville', $body,
     'From: leads@' . $_SERVER['HTTP_HOST']);

header('Location: /thanks.html');
