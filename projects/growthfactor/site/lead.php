<?php // lead.php — minimal form handler (see house-style/references/hostinger-delivery.md)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }
if (!empty($_POST['website'])) { exit; }            // honeypot field
$body = "New Growth Factor lead\n\n";
foreach (['intent','first','last','email','phone','business','note'] as $f) {
  $body .= ucfirst($f) . ': ' . substr(strip_tags($_POST[$f] ?? ''), 0, 600) . "\n";
}
mail('ben@growth-factor.ai', 'Growth Factor lead', $body,
     'From: leads@' . $_SERVER['HTTP_HOST']);
header('Location: /thanks.html');
