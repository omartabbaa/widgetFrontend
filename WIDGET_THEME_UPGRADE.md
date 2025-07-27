# 🎨 Widget Theme Upgrade Documentation

## Overview

The widget has been upgraded to use a new, more detailed theme endpoint that provides granular control over every aspect of the widget's appearance. This replaces the previous basic widget configuration with a comprehensive theming system.

## What Changed

### Previous System
- Used `/api/widget-configurations/business/{businessId}` endpoint
- Limited styling options (basic colors, text, position)
- Simple configuration object

### New System
- Uses `/api/widget-themes/business/{businessId}` endpoint
- **60+ detailed styling properties** for complete customization
- Granular control over every UI element
- Multiple positioning options (bottom-right, bottom-left, top-right, top-left)
- Advanced launcher button styling
- Detailed chat bubble customization
- Comprehensive input and button styling

## New Theme Properties

### 🎯 Basic Widget Settings
- `fontFamily` - Main font for the widget
- `headerText` - Text displayed in the header
- `launcherIcon` - Material icon for the launcher button
- `primaryColor` & `secondaryColor` - Main theme colors
- `showWelcomeMessage` & `welcomeMessage` - Welcome message control
- `textColor` - General text color
- `widgetPosition` - Position on screen (bottom-right, bottom-left, top-right, top-left)
- `widgetShape` - Shape style (rounded, square, circle)

### 🚀 Launcher Button Styling
- `launcherButtonBg` - Background color/gradient
- `launcherButtonColor` - Icon/text color
- `launcherButtonSize` - Button size (e.g., "60px")
- `launcherButtonBorderRadius` - Border radius for shape

### 📋 Header Section
- `headerBgColor` - Header background color
- `headerTextColor` - Header text color
- `headerFontSize` - Header font size
- `headerFontWeight` - Header font weight
- `logoutColor` - Logout button color
- `logoutFontSize` - Logout button font size
- `closeIconColor` - Close button icon color

### 📊 Status Messages
- `loginMsgBg` - Login message background
- `loginMsgText` - Login message text color
- `loginMsgFontSize` - Login message font size
- `usageBoxBg` - Usage info background
- `usageBoxText` - Usage info text color
- `usageBoxFontSize` - Usage info font size

### 💬 Chat Area
- `chatAreaBg` - Chat area background
- `userBubbleBg` - User message bubble background
- `userBubbleText` - User message text color
- `userBubbleFontSize` - User message font size
- `userBubbleFontFamily` - User message font family
- `aiBubbleBg` - AI message bubble background
- `aiBubbleText` - AI message text color
- `aiBubbleFontSize` - AI message font size
- `personalizedTagBg` - Personalized tag background
- `personalizedTagTextColor` - Personalized tag text color
- `personalizedTagFontSize` - Personalized tag font size
- `personalizedTagFontWeight` - Personalized tag font weight

### ⌨️ Input Section
- `inputBg` - Input field background
- `inputTextColor` - Input text color
- `inputPlaceholderColor` - Placeholder text color
- `inputFontSize` - Input font size
- `inputFontFamily` - Input font family
- `inputFormBackground` - Input form background
- `sendButtonBg` - Send button background
- `sendButtonTextColor` - Send button text/icon color
- `sendButtonFontSize` - Send button font size
- `sendButtonFontWeight` - Send button font weight

## Available Endpoints

### Core Theme Operations
- `GET /api/widget-themes/business/{businessId}` - Get current theme
- `POST /api/widget-themes/upsert` - Create or update theme
- `POST /api/widget-themes/business/{businessId}/default` - Get or create default theme
- `POST /api/widget-themes/business/{businessId}/reset` - Reset to default theme
- `GET /api/widget-themes/business/{businessId}/exists` - Check if theme exists

### Granular Property Updates
- `PATCH /api/widget-themes/business/{businessId}/primary-color` - Update primary color
- `PATCH /api/widget-themes/business/{businessId}/secondary-color` - Update secondary color
- `PATCH /api/widget-themes/business/{businessId}/header-text` - Update header text
- `PATCH /api/widget-themes/business/{businessId}/welcome-message` - Update welcome message
- `PATCH /api/widget-themes/business/{businessId}/widget-position` - Update widget position
- `PATCH /api/widget-themes/business/{businessId}/launcher-button-bg` - Update launcher background
- And many more granular endpoints for each property...

## How to Test

### 1. Use the Test Interface
Open `widget-theme-test.html` in your browser to:
- Test all theme operations
- Apply preset themes (Professional Blue, Nature Green, Creative Purple, etc.)
- Update individual properties
- Preview changes in real-time

### 2. Backend Setup
Ensure your backend server is running with the new widget theme endpoints available.

### 3. API Key Configuration
Update your API key and business ID in the test interface or widget configuration.

## Example Usage

### Creating a Custom Theme
```javascript
const customTheme = {
  businessId: 17,
  primaryColor: "#ff6b6b",
  secondaryColor: "#ffe0e0", 
  headerText: "Custom Support",
  welcomeMessage: "Welcome to our custom chat!",
  launcherButtonBg: "linear-gradient(135deg, #ff6b6b, #ee5a52)",
  launcherButtonColor: "#ffffff",
  widgetPosition: "bottom-left",
  userBubbleBg: "#ff6b6b",
  userBubbleText: "#ffffff",
  aiBubbleBg: "#f8f9fa",
  aiBubbleText: "#333333"
};

// Apply the theme
fetch('/api/widget-themes/upsert', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': 'your-api-key'
  },
  body: JSON.stringify(customTheme)
});
```

### Updating a Single Property
```javascript
// Update just the primary color
fetch('/api/widget-themes/business/17/primary-color', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': 'your-api-key'
  },
  body: JSON.stringify({ primaryColor: "#00bcd4" })
});
```

## Benefits of the New System

### 1. **Complete Control**
- Style every aspect of the widget
- Fine-tune colors, fonts, sizes, and spacing
- Create truly branded experiences

### 2. **Better User Experience**
- More positioning options (top-left, top-right, etc.)
- Improved responsive design
- Enhanced animations and transitions

### 3. **Developer Friendly**
- Granular API endpoints for individual properties
- Comprehensive theming options
- Easy preset theme application

### 4. **Performance**
- Optimized CSS with better animations
- Improved scrolling and interactions
- Better mobile responsiveness

## Preset Themes Available

1. **Professional Blue** - Clean and professional
2. **Nature Green** - Eco-friendly and calming
3. **Creative Purple** - Modern and creative
4. **Energetic Orange** - Vibrant and energetic
5. **Dark Mode** - Easy on the eyes
6. **Minimal Light** - Clean and minimal

## Migration Notes

The widget will automatically:
- Fall back to default theme if the new endpoint returns 404
- Maintain backward compatibility
- Log detailed information about theme loading

### Console Logs to Look For
- `🎨 Fetching widget theme for business ID: X`
- `🎨 Successfully fetched widget theme:`
- `🎨 No widget theme found, using default theme`

## Troubleshooting

### Theme Not Loading
1. Check console logs for theme fetch errors
2. Verify business ID and API key are correct
3. Ensure backend server has the new endpoints
4. Use the test interface to verify endpoint availability

### Styling Issues
1. Check that all required theme properties are set
2. Verify color values are valid CSS colors
3. Test with preset themes first
4. Check browser developer tools for CSS conflicts

### Widget Position Issues
1. Ensure `widgetPosition` is one of: bottom-right, bottom-left, top-right, top-left
2. Check CSS classes are being applied correctly
3. Verify no custom CSS is overriding positions

## Future Enhancements

The new theming system provides a foundation for:
- Theme marketplace/gallery
- Advanced animation controls
- Custom CSS injection
- Theme preview functionality
- Multi-language theme support

---

**Ready to create amazing widget experiences!** 🚀 