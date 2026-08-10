import { ShakeSettings } from '../types';
import { audioManager } from './audioManager';

export class ShakeDetector {
  private lastX: number | null = null;
  private lastY: number | null = null;
  private lastZ: number | null = null;
  private lastTime: number = 0;
  private shakeCount: number = 0;
  private isListening: boolean = false;
  private settings: ShakeSettings;

  private onShakeCallback?: () => void;
  private onShakeProgressCallback?: (intensity: number) => void;

  constructor(settings: ShakeSettings) {
    this.settings = settings;
    this.handleDeviceMotion = this.handleDeviceMotion.bind(this);
  }

  public updateSettings(newSettings: ShakeSettings) {
    this.settings = newSettings;
  }

  public setCallbacks(onShake: () => void, onProgress?: (intensity: number) => void) {
    this.onShakeCallback = onShake;
    this.onShakeProgressCallback = onProgress;
  }

  public async requestPermission(): Promise<boolean> {
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<'granted' | 'denied'> }).requestPermission === 'function'
    ) {
      try {
        const permissionState = await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<'granted' | 'denied'> }).requestPermission();
        return permissionState === 'granted';
      } catch (e) {
        console.warn('Error requesting DeviceMotion permission', e);
        return false;
      }
    }
    return true; // Android & standard mobile browsers don't require permission prompts
  }

  public start() {
    if (this.isListening) return;
    const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (isMobile && typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', this.handleDeviceMotion, false);
      this.isListening = true;
    }
  }

  public stop() {
    if (!this.isListening) return;
    const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (isMobile && typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.removeEventListener('devicemotion', this.handleDeviceMotion, false);
      this.isListening = false;
    }
  }

  private handleDeviceMotion(event: DeviceMotionEvent) {
    if (!this.settings.enabled) return;

    const acceleration = event.accelerationIncludingGravity || event.acceleration;
    if (!acceleration || acceleration.x === null || acceleration.y === null || acceleration.z === null) {
      return;
    }

    const curTime = Date.now();
    if (curTime - this.lastTime > 80) { // Check every ~80ms
      const diffTime = curTime - this.lastTime;
      this.lastTime = curTime;

      const { x, y, z } = acceleration;

      if (this.lastX !== null && this.lastY !== null && this.lastZ !== null) {
        const deltaX = Math.abs(x - this.lastX);
        const deltaY = Math.abs(y - this.lastY);
        const deltaZ = Math.abs(z - this.lastZ);

        const speed = ((deltaX + deltaY + deltaZ) / diffTime) * 10000;

        // Sensitivity mapped: 1 (hard threshold: 2500) to 10 (gentle threshold: 900)
        const threshold = 2800 - (this.settings.sensitivity * 180);

        if (speed > threshold) {
          this.shakeCount++;
          const progressIntensity = Math.min(this.shakeCount / 3, 1.0);

          if (this.onShakeProgressCallback) {
            this.onShakeProgressCallback(progressIntensity);
          }

          if (this.settings.soundEnabled) {
            audioManager.playShakeRattle();
          }

          if (this.settings.vibrationEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(30);
          }

          // Trigger roll after 3 energetic shake detection pulses
          if (this.shakeCount >= 3) {
            this.shakeCount = 0;
            if (this.settings.vibrationEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate([40, 30, 60]);
            }
            if (this.onShakeCallback) {
              this.onShakeCallback();
            }
          }
        } else {
          // Slowly decay shake count if motion pauses
          if (this.shakeCount > 0) {
            this.shakeCount = Math.max(0, this.shakeCount - 0.5);
            if (this.onShakeProgressCallback) {
              this.onShakeProgressCallback(this.shakeCount / 3);
            }
          }
        }
      }

      this.lastX = x;
      this.lastY = y;
      this.lastZ = z;
    }
  }

  /**
   * Helper to simulate a shake action manually (e.g. for desktop or button click)
   */
  public triggerSimulatedShake() {
    if (this.settings.vibrationEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([50, 40, 80]);
    }
    if (this.settings.soundEnabled) {
      audioManager.playShakeRattle();
    }
    if (this.onShakeCallback) {
      this.onShakeCallback();
    }
  }
}
