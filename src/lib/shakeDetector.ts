import { ShakeSettings } from '../types';
import { audioManager } from './audioManager';

export class ShakeDetector {
  private lastX: number | null = null;
  private lastY: number | null = null;
  private lastZ: number | null = null;
  private lastTime: number = 0;
  private shakeCount: number = 0;
  private stillnessDuration: number = 0;
  private isCupShaking: boolean = false;
  private isListening: boolean = false;
  private settings: ShakeSettings;

  private onShakeCallback?: () => void;
  private onCupStateChangeCallback?: (isCupShaking: boolean) => void;

  constructor(settings: ShakeSettings) {
    this.settings = settings;
    this.handleDeviceMotion = this.handleDeviceMotion.bind(this);
  }

  public updateSettings(newSettings: ShakeSettings) {
    this.settings = newSettings;
  }

  public setCallbacks(
    onShake: () => void,
    onCupStateChange?: (isCupShaking: boolean) => void
  ) {
    this.onShakeCallback = onShake;
    this.onCupStateChangeCallback = onCupStateChange;
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
    if (curTime - this.lastTime > 70) { // Check every ~70ms
      const diffTime = curTime - this.lastTime;
      this.lastTime = curTime;

      const { x, y, z } = acceleration;

      if (this.lastX !== null && this.lastY !== null && this.lastZ !== null) {
        const deltaX = Math.abs(x - this.lastX);
        const deltaY = Math.abs(y - this.lastY);
        const deltaZ = Math.abs(z - this.lastZ);

        const speed = ((deltaX + deltaY + deltaZ) / diffTime) * 10000;

        // Active shake threshold
        const shakeThreshold = 2800 - (this.settings.sensitivity * 180);
        // Table placement / stillness threshold
        const stillnessThreshold = Math.max(200, shakeThreshold * 0.25);

        if (speed > shakeThreshold) {
          this.shakeCount++;
          this.stillnessDuration = 0;

          // Play cup rattle sound on each shake pulse
          if (this.settings.soundEnabled) {
            audioManager.playShakeRattle();
          }

          if (this.settings.vibrationEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(25);
          }

          // Enter "Cup Shaking" state
          if (this.shakeCount >= 2 && !this.isCupShaking) {
            this.isCupShaking = true;
            if (this.onCupStateChangeCallback) {
              this.onCupStateChangeCallback(true);
            }
          }
        } else if (this.isCupShaking && speed < stillnessThreshold) {
          // Device is placed flat/still on table/platform after shaking
          this.stillnessDuration += diffTime;

          // After ~350ms of stillness on table, release dice from cup to table!
          if (this.stillnessDuration >= 350) {
            this.isCupShaking = false;
            this.stillnessDuration = 0;
            this.shakeCount = 0;

            if (this.onCupStateChangeCallback) {
              this.onCupStateChangeCallback(false);
            }

            if (this.settings.vibrationEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate([40, 30, 60]);
            }

            if (this.onShakeCallback) {
              this.onShakeCallback();
            }
          }
        } else if (!this.isCupShaking) {
          // Slowly decay shake count if motion pauses without entering cup state
          if (this.shakeCount > 0) {
            this.shakeCount = Math.max(0, this.shakeCount - 0.5);
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
    // 1. Cup shaking rattle sound
    if (this.settings.soundEnabled) {
      audioManager.playShakeRattle();
    }
    if (this.settings.vibrationEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([50, 40, 80]);
    }
    if (this.onCupStateChangeCallback) {
      this.onCupStateChangeCallback(true);
    }

    // 2. Table placement roll after brief delay
    setTimeout(() => {
      if (this.onCupStateChangeCallback) {
        this.onCupStateChangeCallback(false);
      }
      if (this.onShakeCallback) {
        this.onShakeCallback();
      }
    }, 500);
  }
}
