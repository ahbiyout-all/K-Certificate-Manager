' ==============================================================================
'  K-Certificate Manager - Invisible Silent App Launcher (launch-web.vbs)
'  Developer: AhBiYout | https://ahbiyoutvibe.blogspot.com/
'  * Launches Native C# WPF App or Web Edition invisibly without any CMD console window
' ==============================================================================
Option Explicit

Dim WshShell, fso, scriptDir, wpfExe, webHtml

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
wpfExe = scriptDir & "\KCertManager.exe"
webHtml = scriptDir & "\dist\index.html"

If fso.FileExists(wpfExe) Then
    ' 1. Priority: Launch Native C# WPF GUI App
    WshShell.Run """" & wpfExe & """", 1, False
ElseIf fso.FileExists(webHtml) Then
    ' 2. Fallback: Launch Web Bundle directly in Default Browser
    WshShell.Run """" & webHtml & """", 1, False
Else
    ' 3. Last Fallback: Launch run-web.cmd completely hidden (Window Style 0 = Hidden)
    WshShell.Run "cmd.exe /c """ & scriptDir & "\run-web.cmd""", 0, False
End If
