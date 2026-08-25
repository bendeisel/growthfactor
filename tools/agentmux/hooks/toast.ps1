<#
.SYNOPSIS
  Show a Windows toast from inside WSL.

.DESCRIPTION
  Called by agentmux via powershell.exe. Uses the WinRT toast API, which is
  available in Windows PowerShell 5.1 (powershell.exe) but not in PowerShell 7
  (pwsh.exe) - so always invoke this with powershell.exe. Falls back to a
  tray balloon if the WinRT types cannot be loaded.

  Override the notifier identity with AGENTMUX_TOAST_APPID if the default
  PowerShell AppID is unregistered on your machine.
#>
param(
  [string]$Title = "agentmux",
  [string]$Body = ""
)

$ErrorActionPreference = "Stop"

$appId = $env:AGENTMUX_TOAST_APPID
if ([string]::IsNullOrWhiteSpace($appId)) {
  $appId = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe'
}

try {
  [void][Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]
  [void][Windows.UI.Notifications.ToastNotification, Windows.UI.Notifications, ContentType = WindowsRuntime]
  [void][Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom, ContentType = WindowsRuntime]

  $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent(
    [Windows.UI.Notifications.ToastTemplateType]::ToastText02)
  $nodes = $template.GetElementsByTagName("text")
  [void]$nodes.Item(0).AppendChild($template.CreateTextNode($Title))
  [void]$nodes.Item(1).AppendChild($template.CreateTextNode($Body))

  $toast = New-Object Windows.UI.Notifications.ToastNotification $template
  [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show($toast)
  exit 0
} catch {
  try {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    $icon = New-Object System.Windows.Forms.NotifyIcon
    $icon.Icon = [System.Drawing.SystemIcons]::Information
    $icon.Visible = $true
    $icon.ShowBalloonTip(5000, $Title, $Body, [System.Windows.Forms.ToolTipIcon]::Info)
    Start-Sleep -Milliseconds 5500
    $icon.Dispose()
    exit 0
  } catch {
    Write-Error $_
    exit 1
  }
}
