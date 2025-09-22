# Background Video Component

## Usage

```jsx
import BackgroundVideo from './BackgroundVideo'
import hazeVideo from '../Images/Video/haze.webm'

// Basic usage
<BackgroundVideo videoSrc={hazeVideo} />

// With performance optimizations
<BackgroundVideo 
  videoSrc={hazeVideo} 
  enablePerformanceMode={true}
  enableMobileOptimization={true}
/>
```

## Performance Features

- **Auto-pause when tab is not visible** (saves CPU/battery)
- **Auto-pause when window loses focus** (saves resources)
- **Mobile optimization** (reduced opacity on mobile)
- **Low-end device detection** (disables on very low-end devices)
- **WebM format** (optimized for web)
- **Hardware acceleration** (CSS transforms for better performance)

## Props

- `videoSrc` (required): Path to the video file
- `enablePerformanceMode` (optional): Enable auto-pause features (default: true)
- `enableMobileOptimization` (optional): Enable mobile optimizations (default: true)

## Performance Impact

**Low Impact:**
- WebM format (highly compressed)
- Muted video (no audio processing)
- Hardware acceleration enabled
- Auto-pause when not visible

**Medium Impact:**
- Continuous video decoding
- Memory usage for video frames
- Battery drain on mobile

**Recommendations:**
- Keep video file under 10MB
- Use 720p resolution max
- 15-24fps frame rate
- Test on low-end devices
