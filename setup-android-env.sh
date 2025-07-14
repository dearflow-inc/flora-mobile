#!/bin/bash

# Android SDK Environment Setup Script
# Run this script to set up Android development environment variables

# Default Android SDK location on macOS
ANDROID_SDK_PATH="$HOME/Library/Android/sdk"

# Check if Android SDK exists
if [ ! -d "$ANDROID_SDK_PATH" ]; then
    echo "Android SDK not found at $ANDROID_SDK_PATH"
    echo "Please complete Android Studio setup first, then run this script again."
    exit 1
fi

# Set environment variables
export ANDROID_HOME="$ANDROID_SDK_PATH"
export ANDROID_SDK_ROOT="$ANDROID_SDK_PATH"
export PATH="$PATH:$ANDROID_HOME/emulator"
export PATH="$PATH:$ANDROID_HOME/platform-tools"
export PATH="$PATH:$ANDROID_HOME/tools"
export PATH="$PATH:$ANDROID_HOME/tools/bin"

# Add to shell profile
SHELL_PROFILE=""
if [[ "$SHELL" == *"zsh"* ]]; then
    SHELL_PROFILE="$HOME/.zshrc"
elif [[ "$SHELL" == *"bash"* ]]; then
    SHELL_PROFILE="$HOME/.bash_profile"
    if [ ! -f "$SHELL_PROFILE" ]; then
        SHELL_PROFILE="$HOME/.bashrc"
    fi
fi

if [ -n "$SHELL_PROFILE" ]; then
    echo "" >> "$SHELL_PROFILE"
    echo "# Android SDK Environment Variables" >> "$SHELL_PROFILE"
    echo "export ANDROID_HOME=\"$ANDROID_HOME\"" >> "$SHELL_PROFILE"
    echo "export ANDROID_SDK_ROOT=\"$ANDROID_SDK_ROOT\"" >> "$SHELL_PROFILE"
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/emulator\"" >> "$SHELL_PROFILE"
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/platform-tools\"" >> "$SHELL_PROFILE"
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/tools\"" >> "$SHELL_PROFILE"
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/tools/bin\"" >> "$SHELL_PROFILE"
    
    echo "Environment variables added to $SHELL_PROFILE"
    echo "Please restart your terminal or run: source $SHELL_PROFILE"
else
    echo "Could not determine shell profile. Please manually add these to your shell configuration:"
    echo ""
    echo "export ANDROID_HOME=\"$ANDROID_HOME\""
    echo "export ANDROID_SDK_ROOT=\"$ANDROID_SDK_ROOT\""
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/emulator\""
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/platform-tools\""
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/tools\""
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/tools/bin\""
fi

echo ""
echo "Android SDK setup complete!"
echo "SDK Location: $ANDROID_SDK_PATH" 