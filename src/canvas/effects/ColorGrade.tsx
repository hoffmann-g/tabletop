import { EffectComposer, HueSaturation, BrightnessContrast, Vignette } from '@react-three/postprocessing'

export interface ColorGradeProps {
  /** Drop saturation to 0 for the "preto e branco" look the design mentions. */
  saturation?: number
  brightness?: number
  contrast?: number
}

/**
 * Full-scene color grading. Driven by session state later (e.g. master flips
 * the table to black & white, or applies a mood effect). Kept as a single
 * EffectComposer so adding more passes is cheap.
 */
export function ColorGrade({
  saturation = 0,
  brightness = 0,
  contrast = 0.05
}: ColorGradeProps): JSX.Element {
  return (
    <EffectComposer>
      <HueSaturation saturation={saturation} />
      <BrightnessContrast brightness={brightness} contrast={contrast} />
      <Vignette eskil={false} offset={0.2} darkness={0.7} />
    </EffectComposer>
  )
}
