To use auto-upload of the Qlik Sense extension code on-save ...

- make relevant settings in `settings.json`: (Example located in the .vscode folder called 'example.settings.json' you can rename this to settings.json or create new)
- create an attribute named like your computer (hostname)
- VS Code will paint those options as greyed out, but thats ok (those are unknown attributes for the "Run On Save" but have
  a meaning to the updateExtension.ps1 Powershell file)