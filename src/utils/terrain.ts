export function getDuneHeight(x: number, z: number) {
    // 1. Platform Flattening (Central Sanctuary)
    const dist = Math.sqrt(x * x + z * z);
    const platformRadius = 45.0; // Increased from 25.0 to push dunes back
    const blendRadius = 120.0;   // Increased from 70.0 for smoother transition

    let blend = 1.0;
    if (dist < blendRadius) {
        const t = Math.max(0, (dist - platformRadius) / (blendRadius - platformRadius));
        blend = t * t * (3.0 - 2.0 * t); // Smoothstep
        if (dist < platformRadius) blend = 0.0;
    }

    if (blend <= 0.001) return -0.5; // Slightly sunken flat area

    // 2. Domain Warping (Wind Flow)
    // Wind coming from roughly (-1, -1) direction
    const warpFreq = 0.008;
    const warpAmp = 15.0;
    const wx = x + Math.sin(z * warpFreq) * warpAmp;
    const wz = z + Math.sin(x * warpFreq * 1.5) * warpAmp;

    let y = 0;

    // 3. Primary Dunes (Large, Barchan-like shapes)
    // Sharp crests using 1.0 - abs(sin)
    // Frequency
    const f1 = 0.012;
    // Sharpness control: Higher power = sharper valleys
    // const dune1 = Math.pow(Math.sin(wx * f1 + Math.cos(wz * f1 * 0.5)), 2.0);

    // Asymmetric wind face vs slip face
    // We combine a smooth wave and a sharp ridged noise
    const primaryDune = (1.0 - Math.abs(Math.sin(wx * f1))) * 15.0;

    y += primaryDune;

    // 4. Secondary Dunes (Crossing transverse waves)
    const f2 = 0.03;
    const ridge2 = 1.0 - Math.abs(Math.sin(wz * f2 + wx * 0.2 * f2));
    // Modulate height by primary dune phase to cluster them
    y += Math.pow(ridge2, 3.0) * 5.0;

    // 5. Micro-terrain (Ripples/Roughness)
    // High frequency noise
    const f3 = 0.1;
    y += Math.sin(x * f3) * Math.cos(z * f3 * 1.2) * 0.5;

    // 6. Global Elevation Variation (Rolling hills)
    y += Math.sin(x * 0.003) * 10.0 + Math.cos(z * 0.005) * 10.0;

    // Apply Platform Blend
    return y * blend - 0.5;
}
