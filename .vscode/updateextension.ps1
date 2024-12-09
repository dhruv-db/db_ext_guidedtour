# Script will upload the extension (that is the parent path to this .ps1 script)
# to Qlik Sense Windows or Qlik Cloud or both, depending on the settings in settings.json
# if the extension already exists, it will be patched with the new version

# source: https://github.com/ChristofSchwarz/vs-code-qlikextension/blob/main/.vscode/updateExtension.ps1

# Christof Schwarz, 06-Jun-2022, Original version
# Christof Schwarz, 21-Jun-2022, fix to check if .bat file or .git folder exists before deleting it
# Christof Schwarz, 15-Jul-2022, delete all *.ps1 files in the zip copy
# v1.1, Christof Schwarz, 25-Sep-2022, ask to enter new API Key in cloud, when first command fails 
# v1.1.1, Christof Schwarz, 11-Oct-2022, coloring the console output
# v1.1.2, Christof Schwarz, 02-Nov-2022, fix for younger qlik.exe versions
# v1.2, Christof, 22-Apr-2024, allow multiple configs for different computers in settings.json
# v1.3, Christof, 01-Mai-2024, prompt user for key and option to upload extension under temp name
# v1.3.1, Dhruv, 07-May-2024, if buily type = 1 then creating obfuscated files, for 0 (developer) build no obfuscation (We are using external NPM lib for obfuscation "npm i -g javascript-obfuscator")
# v1.3.2, Christof stop on error

$ErrorActionPreference = "Stop"
$hostname = hostname 
Write-Host "*** running " -NoNewline
Write-Host -f Cyan "updateextension.ps1" -NoNewLine
Write-Host " v1.3 on computer '$($hostname)' ***"

# Read settings from Json file
$settings = Get-Content -Raw -Path ".vscode\settings.json" | ConvertFrom-Json

# Make some pre-flight checks

if (!($settings.PSObject.Properties.Name -contains $hostname)) {
    Write-Host -f red ".vscode\settings.json does not have an attribute for hostname '$hostname'."
    Exit
} 
$settings = ($settings | Select-Object -ExpandProperty $hostname)

if ($settings.save_to -eq "cloud" -or $settings.save_to -eq "both") {
    $qlik_exe = $settings.qlik_cli_location 
    if (Test-Path -Path $qlik_exe -PathType Leaf) {
        Write-Host "Using Qlik CLI:" $qlik_exe
    }
    else {
        Write-Host -f Red "Qlik-CLI '$qlik_exe' not found."
        Exit
    }
}
# Figure out the name of the extension by the .qext file
$folder = (Split-Path $PSScriptRoot -Parent)
if ((Get-ChildItem -Path $folder -filter *.qext | Measure-Object).Count -ne 1) {
    Write-Host "The extension folder does not have ONE .qext file" -f 'red' 
    Exit
}
$extension_name = (Get-ChildItem "$($folder)\*.qext" | Select-Object BaseName).BaseName
Write-Host -f Green "`nPress [1] " -NoNewline
Write-Host "key to upload this as extension " -NoNewLine
Write-Host -f Green $extension_name
if ($settings.extension_temp_name) {
    $extension_temp_name = $settings.extension_temp_name
    Write-Host -f Yellow "Press [0] " -NoNewline
    Write-Host "key to upload this as extension " -NoNewline
    Write-Host -f Yellow "~$($extension_temp_name)"
}
else {
    $extension_temp_name = $extension_name
}
# Write-Host "Extension is $($extension_name)"

# Prompt the user to press any key
Write-Host "`nPress key within 8 seconds to continue, otherwise nothing will happen $([char]8595)"

# Get the current time
$startTime = Get-Date

# Loop for up to 5 seconds
while ((Get-Date) -lt ($startTime.AddSeconds(8))) {
    # Check if a key is available
    # Check if a key is available
    if ([System.Console]::KeyAvailable) {
        # Read the key
        $key = [System.Console]::ReadKey()
        if ($key.KeyChar -ne "1" -and $key.KeyChar -ne "0") {
            Write-Host "'nUnexpected key pressed: $($key.KeyChar)"
            Exit
        }
        else {
            Write-Host ""
        }
        # Output the pressed key
        if ($key.KeyChar -eq "1") {
            $extension_temp_name = $extension_name
        }        
        
        # Make a temp copy of this work folder but remove the .ps1 file (Qlik Cloud wont
        # allow a .ps1 or .bat file to be part of an extension .zip)
        $rnd = Get-Random
        Copy-Item "$($folder)" -Destination "$($folder)$($rnd)" -Recurse -Container
        # if (Test-Path -Path "$($folder)$($rnd)\node_modules" -PathType Container) {
        #     Write-Host 'removing "node_modules" subfolder ...'
        #     Remove-Item -LiteralPath "$($folder)$($rnd)\node_modules" -Force -Recurse
        # }
        Remove-Item -LiteralPath "$($folder)$($rnd)\.vscode" -Force -Recurse
        Get-ChildItem "$($folder)$($rnd)\*.cmd" -Recurse | Remove-Item
        Get-ChildItem "$($folder)$($rnd)\*.bat" -Recurse | Remove-Item
        Get-ChildItem "$($folder)$($rnd)\*.ps1" -Recurse | Remove-Item
        Get-ChildItem "$($folder)$($rnd)\*.njs" -Recurse | Remove-Item

        if ($extension_temp_name -ne $extension_name) {

            # rename the extension before uploading
            Rename-Item "$($folder)$($rnd)\$($extension_name).qext" "$($folder)$($rnd)\$($extension_temp_name).qext"
            Rename-Item "$($folder)$($rnd)\$($extension_name).js" "$($folder)$($rnd)\$($extension_temp_name).js"
            # patch the 'name' in the .qext file.
            $jsonData = Get-Content -Path "$($folder)$($rnd)\$($extension_temp_name).qext" -Raw | ConvertFrom-Json
            $jsonData.name = "~$extension_temp_name"
            $jsonString = $jsonData | ConvertTo-Json -Depth 10
            $jsonString | Set-Content -Path "$($folder)$($rnd)\$($extension_temp_name).qext"
            $extension_name = $extension_temp_name
        }
        else {

            #Write-Host Get-ChildItem "$($folder)$($rnd)
            #Build Obfuscated files
            $folderPath = "$($folder)$($rnd)"

            # Get only, all JavaScript files in the folder
            $javascriptFiles = Get-ChildItem -Path $folderPath -Filter *.js

            foreach ($file in $javascriptFiles) {
                $fileName = $file.Name

                # Obfuscate the JavaScript file
                & javascript-obfuscator "$folderPath\$fileName"
                
                # Remove the original JavaScript file
                Remove-Item "$folderPath\$fileName"
                
                # Rename the obfuscated JavaScript file to its original name
                Rename-Item "$folderPath\$($fileName.Replace('.js', '-obfuscated.js'))" "$folderPath\$fileName"
            }

        }
        
        if (Test-Path -Path "$($folder)$($rnd)\doc") {
            Remove-Item -LiteralPath "$($folder)$($rnd)\doc" -Force -Recurse
        }
        if (Test-Path -Path "$($folder)$($rnd)\.git") {
            Remove-Item -LiteralPath "$($folder)$($rnd)\.git" -Force -Recurse
        }
        # if (Test-Path "$($folder)$($rnd)\*.ps1" -PathType leaf) {
        #     Remove-Item "$($folder)$($rnd)\*.ps1" -Force
        # }

        Write-Host "Creating zip file from folder '$($folder)'"

        # create a zip file from the temp folder then remove the temp folder 
        $file = "$($folder)_upload.zip"
        if (Test-Path $file) {
            Remove-Item $file
        }
        Compress-Archive -Path "$($folder)$($rnd)" -DestinationPath "$file"
        Remove-Item -LiteralPath "$($folder)$($rnd)" -Force -Recurse

        # ------------------- Qlik Sense Windows ------------------------

        if (@("win", "both").Contains($settings.save_to)) {
            # want to upload to Qlik Sense on Windows
            Write-Host -f Cyan "`n--> Qlik Sense on Windows: Publishing extension '$($extension_name)'"
            if ($settings.client_cert_passphrase) {
                Write-Host -f Cyan "passphrase found."
                $securePassword = ConvertTo-SecureString -String $settings.client_cert_passphrase -AsPlainText -Force
                $cert = Get-PfxCertificate -FilePath $settings.client_cert_location -Password $securePassword
            }
            else {
                $cert = Get-PfxCertificate -FilePath $settings.client_cert_location
            }
            $api_url = $settings.qrs_url
            $xrfkey = "A3VWMWM3VGRH4X3F"
            $headers = @{
                "$($settings.header_key)" = $settings.header_value; 
                "X-Qlik-Xrfkey"           = $xrfkey
            }
    
    
            $extension_list = Invoke-RestMethod "$($api_url)/extension?filter=name eq '$($extension_name)'&xrfkey=$($xrfkey)" `
                -Headers $headers `
                -Certificate $cert -SkipCertificateCheck `
            | ConvertTo-Json
    
            $extension_list = $extension_list | ConvertFrom-Json
    
            if ($extension_list.length -eq 0) {
                Write-Host "Extension '$($extension_name)' does not exist. Uploading it first time ...'" 
                $gotoupload = 1
            }
            elseif ($extension_list.length -eq 1) {
                $extension_id = $extension_list[0].id
                Write-Host "Removing existing extension '$($extension_name)' ($($extension_id)) ..." 
                Invoke-RestMethod -method 'DELETE' "$($api_url)/extension/$($extension_id)?xrfkey=$($xrfkey)" `
                    -Headers $headers `
                    -Certificate $cert -SkipCertificateCheck
                $gotoupload = 1
            }
            else {
                Write-Host "Error: The name '$($extension_name)' exists $($extension_list.value.length) times."
                $gotoupload = 0
            }
    
            if ($gotoupload -eq 1) {
                $new_ext = Invoke-RestMethod -method 'POST' "$($api_url)/extension/upload?xrfkey=$($xrfkey)" `
                    -Headers $headers `
                    -Certificate $cert -SkipCertificateCheck `
                    -inFile $file `
                | ConvertTo-Json -Depth 4
                # Remove-Item $file
                $new_ext = $new_ext | ConvertFrom-Json
                Write-Host "Extension '$($extension_name)' uploaded ($($new_ext[0].id))"
            }
        }

        # ------------------- Qlik Cloud ----------------------

        if (@("cloud", "both").Contains($settings.save_to)) {
            # want to upload to Qlik Cloud
            
            $resp = & $qlik_exe context use "$($settings.qlik_cli_context)" 
            # if the response is an Error (length: 0), that is when the context doesn't exist, skip the rest.
            if ($resp.length -gt 0) {
    
                Write-Host -f Cyan "`n--> Qlik Cloud: Publishing extension '$($extension_name)' to '$($settings.qlik_cli_context)'"
                # $extension_exists = & $qlik_exe extension get "$($extension_name)"
                $extension_list = & $qlik_exe extension ls
                if (-not $extension_list) {
                    Write-Host -f Red "Error: qlik.exe does not answer as expected."
                    $server = & $qlik_exe context get | Where-Object { $_ -like "Server:*" }
                    $server = ($server.split('erver:')[1]).Trim()
                    $context = & $qlik_exe context get | Where-Object { $_ -like "Name:*" }
                    $context = ($context.split('ame:')[1]).Trim()
                    Write-Host -F Green "Try context $context with a new API Key, get it on $server"
            
                    $apikey = Read-Host -Prompt "New API Key (leave emtpy to quit)"
                    if (-not $apikey) { 
                        Exit 
                    }
                    $info = & $qlik_exe context update "$context" --api-key $apikey
                    # Write-Host -F Green (ConvertTo-Json -i $info)
                    $extension_list = & $qlik_exe extension ls
                    if (-not $extension_list) {
                        Write-Host -f Red "Error: qlik.exe still does not answer as expected."
                        Write-Host -f Red "Please get qlik.exe work with the context $context"
                    }
                }
                $extension_list = $extension_list | ConvertFrom-Json

                # parse through the response Json list of extensions and look for the given one
                $extension_id = ""

                foreach ($extension in $extension_list) {
                    # Write-Host "is it $($extension.qextFilename) ?"
                    if ($extension.qextFilename -like "$($extension_name)") {
                        $extension_id = $extension.id
                        Write-Host "Patching existing extension '$($extension_name)' (id $($extension_id))"
                    } 
                }


                if ($extension_id -eq "") {
                    
                    Write-Host "Uploading extension '$($extension_name)' first time ..."
                    $resp = & $qlik_exe extension create "$($extension_id)" --file "$($file)"
                }
                else {
                    $resp = & $qlik_exe extension patch "$($extension_id)" --file "$($file)"
                }
    
                if ($resp.Length -gt 0) {
                    $resp = $resp | ConvertFrom-Json
                    Write-Host "Extension $extension_name uploaded (id $($resp.id))"
                }
                else {
                    # test
                    Write-Host -f Red 'An error occurred. Not getting expected response.'
                }
            }
        } 
        # Exit the loop
        break
    }

    
    # Wait for a short period before checking again
    Start-Sleep -Milliseconds 100
    Write-Host '.' -NoNewline
}
