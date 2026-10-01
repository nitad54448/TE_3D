# Thermoelectric Lab · 3D

Thermoelectric Lab solves coupled heat and charge transport in a planar 2D domain. You paint materials on a rectangular grid, place two electrodes, set the thermal condition of each side, and compute temperature T(x,y,t) and electric potential V(x,y,t) under DC, single-frequency AC or swept-frequency excitation. All computation runs locally in the browser, in a background worker. The 3D edition adds a static magnetic field perpendicular to the plane, with the Hall, magnetoresistance, Nernst, Ettingshausen and Righi–Leduc effects (see *Magnetic field (3D)*). With the field at zero it reproduces the 2D results exactly.

## Running the application

The application folder contains:

- `index.html`: the application
- `assets/`: scripts and styles
- `lib/`: the material library (`index.json` and one JSON file per material)
- `tests/regression.cjs`: the Node regression suite

Serve the folder with any static web server and open `index.html`, for example `python3 -m http.server 8000` in the folder, then `http://localhost:8000/`. No internet connection is needed.

Opening `index.html` directly from disk also works. Browsers do not let a page opened from disk read `lib/*.json`, so the material library is then read from `lib/catalog.js`, the offline copy that `python lib/build_catalog.py` writes next to `lib/index.json`: rebuild it after editing material files.

The interface has a dark and a light theme. It follows the system setting until you choose one with the header toggle, and remembers that choice.

## Workflow

1. **Geometry**: set the widths, element counts and out-of-plane depth, then **Apply mesh**. Paint cells with the selected material. The bars on the domain edges are the electrodes, labelled *source* and *sink*.
2. **Materials**: edit properties, add materials (up to 12), load presets from the library, or import a material JSON file.
3. **Boundaries**: choose the excitation, the electrical control mode, the electrode positions and the thermal condition of each side.
4. **Solver**: shows the solution method; periodic runs set the frequency, time steps per period and maximum cycles here.
5. **Run simulation**, then inspect **Results**.

**Run simulation** and **Save project** also apply pending mesh changes. Remeshing resamples the material map, so inspect material regions afterwards. Invalid inputs are highlighted and listed above the tabs; Run and Save project stay disabled until they are corrected.

## Physical model

### Governing equations

T is absolute temperature (K), V electric potential (V), J current density and q total heat flux. Each material defines σ(T) and α(T), and a constant thermal conductivity k, density ρ and heat capacity Cp. The two constitutive laws below hold at Bz = 0. In a field they are replaced by the tensor laws of *Magnetic field (3D)*; ∇·J = 0, the energy equation and the boundary conditions are unchanged.

```
J = −σ(T) [∇V + α(T) ∇T]
∇·J = 0
q = α(T) T J − k ∇T
ρ Cp ∂T/∂t = −∇·q − J·∇V
```

Within a smooth homogeneous material at Bz = 0 these equations give

```
ρ Cp ∂T/∂t = ∇·(k ∇T) + |J|²/σ − T (dα/dT) J·∇T
```

where the last two terms are Joule and Thomson heating. Π = αT is the Peltier coefficient; discontinuities in α at material interfaces produce Peltier transport through q. Joule, Peltier and Thomson effects are all contained in the total flux and must not be added a second time.

### Material laws

Properties are referenced to 300 K:

```
ρe(T) = [1 + β (T − 300)] / σ300      electrical resistivity
α(T)  = α300 + α′ (T − 300)          Seebeck coefficient
```

Density, heat capacity and thermal conductivity are constant. Materials are isotropic; a magnetic field adds the field-induced terms described in *Magnetic field (3D)*. σ, k, ρ and Cp must remain strictly positive at 300 K and at the extreme prescribed temperatures of the model.

### Boundary and interface conditions

Electrical:

- The two electrodes are equipotential contacts on the domain edge; the sink is grounded at 0 V. All other edges are insulated (J·n = 0).
- The terminal voltage is U = V(source) − V(sink), and the terminal current I enters at the source and leaves at the sink. This is the passive sign convention: a resistor gives U = R·I, and the absorbed electrical power is U·I.
- **Total current**: I is prescribed (A). The terminal voltage adjusts to deliver it. Current density may vary across an electrode.
- **Terminal voltage**: U is prescribed (V).
- **Open circuit**: zero net terminal current.
- The external leads are ideal conductors with zero Seebeck coefficient. U is therefore measured against an α = 0 reference, and an electrode on thermoelectric material exchanges the contact Peltier heat α·T·I with its lead: heat is absorbed where positive current enters a material with α > 0 and released where it leaves. On a side with a flux or convection condition this heat stays in the domain.
- Electrode ranges are given in % along the edge, bottom→top on vertical edges and left→right on horizontal edges. Each electrode needs at least two boundary nodes, and the electrodes must not share a node. Each electrode must also touch conducting material: validation rejects an electrode whose neighbouring cells are all at least 10¹⁴ times less conductive than the best conductor in the model (for example an electrode placed on alumina or air next to copper), because such a current path cannot be resolved in double precision. Resistive contacts, such as a semiconductor next to copper, are fine.

Thermal, for each side (n is the outward normal):

- **Temperature**: T is prescribed (K).
- **Outward total flux**: q·n is prescribed (W/m², positive outward, including Peltier transport). Zero flux is adiabatic.
- **Convection**: q·n = h (T − Tambient); the entered value is the ambient temperature (K). A side with h = 0 is inactive.

Fixed-temperature sides that meet at a corner must have identical waveforms. A steady problem needs a thermal anchor: a temperature side, or convection with h > 0.

Interfaces are ideal: T, V, normal J and normal total q are continuous, with no contact resistance. Peltier coupling changes the conductive-flux balance at an interface, qcond,right − qcond,left = −Jn T (αright − αleft); T stays continuous while its slope changes.

### Excitation and harmonics

Every electrical and thermal input has the form `b + A cos(2πft + φ)`: DC bias b, AC peak A and phase φ in degrees. One frequency f applies to all inputs.

- **DC · constant electrical drive** solves the stationary problem (∂T/∂t = 0) using only the DC biases. It disables the electrical AC peak and phase but keeps their values for when AC is selected again.
- **AC · single frequency** integrates in time until the solution is periodic.
- **AC · multifrequency sweep** repeats the periodic solution over a list of frequencies (see *Frequency sweeps and Bode analysis*).
- A nonzero thermal AC peak selects the periodic solver even with DC electrical drive.
- In periodic runs, prescribed and ambient temperatures must stay above 0 K for the whole cycle (DC > |AC peak|).

The nonlinear time-domain solution is described by peak phasors (not RMS) of the last complete cycle:

```
u(t) = U0 + Re[ Σ Un exp(i n ω t) ],   n = 1, 2, 3
```

U0 is the signed DC mean. Re and Im are the signed components of Un; Im multiplies −sin(nωt). Instantaneous fields use the stored time samples, which contain all resolved harmonics, not only DC to 3ω.

### Planar geometry and scope

The out-of-plane depth is constant throughout the domain. It converts current density to amperes and heat flux to watts, and Ly × depth is the cross-section of a 1D reduction. For the transverse-uniform 1D limit along x, set Ny = 1, use full left/right electrodes and zero top/bottom flux.

Not modelled: contact resistance, electrical capacitance or inductance, radiation, convection inside the domain, front/back surface heat loss and anisotropic properties other than those created by the magnetic field. The geometry stays planar: the magnetic field of the 3D edition acts perpendicular to this plane.

## Magnetic field (3D)

The 3D edition adds a static, uniform magnetic field Bz perpendicular to the plane. The geometry stays planar; the field acts along the third axis. With Bz = 0 the equations and the numerics are exactly those of the 2D model, and a zero-field run reproduces 2D results bit for bit.

### Field and sign conventions

- Bz is given in tesla, between −100 and 100 T, on the Boundaries tab. Positive Bz points out of the screen (x to the right, y up).
- Only the perpendicular component acts in a planar model: in-plane fields would push carriers across the thickness, which a planar model cannot represent. For a sample tilted by θ in a field |B|, enter Bz = |B|·cos θ.
- The field is uniform and static; induction (∂B/∂t) is not modelled. The drive can still be AC, as in lock-in Hall measurements.

### Constitutive laws

With R the rotation by +90° in the plane (R·v = ẑ × v):

    E = ρ(1 + m·B²)·J + R_H·B·R·J + α·∇T + N·B·R·∇T
    q = T·(α·J + N·B·R·J) − κ·(∇T − S·B·R·∇T)

These laws replace J = −σ(∇V + α∇T) and q = αTJ − k∇T. Charge conservation ∇·J = 0 and the energy equation ρCp ∂T/∂t = −∇·q − J·∇V hold unchanged. Solved for the current, with E = −∇V, ρ′ = ρₑ(T)(1 + m·B²) and h = R_H·B:

    J = σ̂ (E − α∇T − N·B·R∇T),   σ̂ = (ρ′ − h·R) / (ρ′² + h²)

Within a smooth homogeneous material the energy equation becomes

    ρCp ∂T/∂t = ∇·(κ∇T) + ρ′|J|² − T(dα/dT) J·∇T + 2N·B·ẑ·(∇T × J) + N·B·T·ẑ·(∇ × J)

The Hall term does no work (J·RJ = 0), and the Righi–Leduc term only redistributes heat. The last two terms are the reversible bulk heat of the Nernst–Ettingshausen pair, the field's counterpart of Thomson heat.

Each material has four magnetic coefficients, constant and 0 by default:

| Coefficient | Unit | Defined by |
|---|---|---|
| Hall R_H | m³/C | E_y = R_H·B·J_x in a long bar; R_H = 1/(nq), negative for electrons |
| Magnetoresistance m | 1/T² | ρ_xx = ρ·(1 + m·B²); 1 + m·B² must stay positive |
| Nernst N | V/(K·T) | E_y = N·B·∂T/∂x without current |
| Righi–Leduc S | 1/T | ∂T/∂y = S·B·∂T/∂x without current or transverse heat flow |

The Peltier tensor T·(α + N·B·R) follows from Onsager reciprocity, so the Ettingshausen effect needs no coefficient of its own: ∂T/∂y = P·B·J_x with P = T·N/κ (Bridgman relation). The Hall term does no work, and the energy balance closes exactly as in 2D. Material files may carry the optional keys `hall`, `nernst`, `righiLeduc` and `magnetoresistance` in SI units.

### What drives each effect

Each effect needs its own driver in the plane, and appears only if the material's coefficient is not zero:

| Effect | Driver | Response |
|---|---|---|
| Hall (R_H) | current | electric field across the current |
| Magnetoresistance (m) | current | higher resistance along the current |
| Ettingshausen (from N) | current | temperature gradient across the current |
| Nernst (N) | temperature gradient | electric field across the gradient |
| Righi–Leduc (S) | temperature gradient | temperature gradient across the gradient |

- **No pre-existing gradient is needed** for Hall, magnetoresistance or Ettingshausen: a current is enough. The Ettingshausen gradient builds up by itself where heat cannot leave sideways, for example at insulated long edges.
- **The driver can point in any in-plane direction.** The model is isotropic in the plane, so a current or gradient along x gives a response along y, and one along y gives a response along x. The response always lies along ẑ × (driver), rotated by 90°, with its sign set by the coefficient and the sign of Bz. Rotating a setup by 90° rotates its response with it. In a real sample the orientation matters only through the contacts and edges you place.
- **The effects feed each other.** An Ettingshausen gradient drives Nernst and Righi–Leduc responses, and a Joule-heating gradient in a current-carrying bar drives a Nernst field. All of these couplings are solved together.
- **To observe them:**
  - a voltage across the driver: place the Hall probes P+ and P− on either side of the current or gradient;
  - a temperature difference across it: use insulated edges and read the temperature map or the probe;
  - Nernst and Righi–Leduc alone: run in open circuit with a temperature difference between two sides.

### Hall voltage

- Two point probes, P+ and P−, are placed on the Boundaries tab in % of the width and height, and drawn on the maps. They must snap to different nodes. The Hall voltage is V_H = V(P+) − V(P−).
- The default probes, P+ at the bottom middle and P− at the top middle, give V_H = R_H·I·B/t for current along +x in a long bar, t being the depth. Holes (R_H > 0) give a positive V_H.
- V_H is reported only when the field acts: Bz ≠ 0 and a painted material has a Hall, Nernst or Righi–Leduc coefficient. Otherwise V(P+) − V(P−) is just the potential difference between two points (for example across a floating insulator), and the results show — with the reason.
- The results show V_H (the DC value, or the 1ω amplitude and phase) with R_xy = V_H/I (DC, or the complex 1ω ratio as magnitude and phase); R_xy needs a terminal current, so it is absent in open circuit. Reports list the field, the probes and the magnetic coefficients, mark the probes on every map, and give V_H and R_xy (DC, or the DC–3ω harmonics and waveform of V_H). `terminal.csv` has a `hall_voltage_V` column with V(P+) − V(P−) in every case, and the Bode plots offer the Hall voltage as a quantity when the field acts.

### Numerics

Each link keeps its own longitudinal field and takes its transverse field from the average of the two perpendicular links of its cell. For a link a→b of length L and half-face area A, with e = [V_a − V_b − α_mean(T_b − T_a)]/L, ē the cell average of e over the two links of the other direction, ∂T/∂x and ∂T/∂y the cell-average gradients, ρ′ the link-mean ρₑ times (1 + m·B²), σ_L = ρ′/(ρ′² + h²) and σ_H = h/(ρ′² + h²):

    x link:  I_ab = A [σ_L (e + N·B·∂T/∂y) + σ_H (ē_y − N·B·∂T/∂x)]
    y link:  I_ab = A [σ_L (e − N·B·∂T/∂x) − σ_H (ē_x + N·B·∂T/∂y)]
    x link:  Q_ab = α_mean (T_a + T_b) I_ab / 2 − κ_mean A [(T_b − T_a)/L + S·B·∂T/∂y] − A·T_mid·N·B·J̄_y
    y link:  Q_ab = α_mean (T_a + T_b) I_ab / 2 − κ_mean A [(T_b − T_a)/L − S·B·∂T/∂x] + A·T_mid·N·B·J̄_x

J̄ is the cell-average current density and T_mid = (T_a + T_b)/2. Electrical work I_ab(V_a − V_b) is shared between the two nodes, as at Bz = 0, so the energy balance closes exactly. The electrical system becomes non-symmetric (and the thermal one with Righi–Leduc), so it is solved by banded Gaussian elimination with partial pivoting instead of conjugate gradients. Nodes are numbered along the shorter mesh side, which keeps the bandwidth at min(Nx, Ny) + 2 and makes each solve exact at any Hall angle. The terminal current keeps the reciprocity formula I = Σ I_k·Δu_k, which holds for any current field that satisfies Kirchhoff's law. The electrical factorization is reused while the resistivities are unchanged, which for β = 0 means the whole run. Ettingshausen transport enters the heat balance like Peltier transport.

At 1600 nodes, steady runs take about as long as in 2D. Periodic runs with only the Hall effect and β = 0 are faster than in 2D; with every magnetic effect and a temperature-dependent resistivity they are about four times slower.

### Validation

| Check | Result |
|---|---|
| Long Hall bar, V_H = R_H·I·B/t | exact |
| van der Pauw, ΔV = R_H·I·B/t for any sample shape, with 5 % corner contacts | 0.4 % (the theorem assumes point contacts) |
| Nernst, Ettingshausen (Bridgman) and Righi–Leduc transverse responses | ≤ 0.001 % |
| AC Hall voltage, amplitude and phase | exact |
| Hall voltage at a Hall angle μB = 7 | 10⁻⁵ relative |
| Two-terminal resistance R(+B) = R(−B) (Onsager) | 8·10⁻¹⁵ relative |
| Energy balance with every effect at once | 5·10⁻¹³ W of 10⁻⁴ W |
| Bz = 0 against the 2D code | bit-identical |

## Numerical method

**Discretization.** Conservative, grid-aligned nodal control volumes on a uniform mesh of Nx × Ny rectangular cells with (Nx + 1)(Ny + 1) nodes. Each cell contributes four half-face links. For a link a→b of length L and half-face area A:

```
g   = A / [L · mean(ρe(Ta), ρe(Tb))]
Iab = g [Va − Vb − αmean (Tb − Ta)]
Qab = αmean (Ta + Tb) Iab / 2 − kmean A (Tb − Ta) / L
```

Electrical work Iab(Va − Vb) is shared equally between the two nodes. Each cell's heat capacity is split among its four corners.

**Electrical problem.** The potential is the superposition of a solution with both electrodes at 0 V (Seebeck sources only) and a unit solution with the source at 1 V and the sink at 0 V. Terminal currents follow from reciprocity over the whole domain, I = Σ I_ab·(u_a − u_b) over all links with u the unit solution. This is exact for any link currents that satisfy Kirchhoff's law, including the non-symmetric ones in a field, and stays accurate where highly conductive contacts meet resistive regions.

**Linear systems.** The symmetric systems use matrix-free conjugate gradients with Jacobi preconditioning, relative tolerance 2·10⁻¹² in the Jacobi-weighted residual norm, warm-started from the previous solution. In a field, the non-symmetric systems use banded LU (see *Magnetic field (3D)*).

**Nonlinear coupling.** The electrical and thermal problems are coupled by Picard iteration, undamped first. The Peltier and Thomson heat of each node has the exact form −T·c, with c computed from the link currents. Where c > 0 (Peltier cooling) this term is treated implicitly on the matrix diagonal: the matrix stays symmetric positive definite, the converged solution is unchanged, and the iteration does not oscillate at high current as it would with a lagged cooling term. In the thermoelectric module example the steady solution converges in 5 to 8 iterations up to at least 20 A. If an undamped step fails or stops contracting, it is repeated with damping 0.85; after three such fallbacks the run stays damped. A step is accepted when the temperature update is ≤ 2·10⁻⁹ K and the normalized heat-balance residual is ≤ 1. If the update has converged but the heat balance has not, the next thermal solve uses a 100× tighter conjugate-gradient tolerance. This matters with small time steps, where the linear tolerance, relative to heat capacity × absolute temperature, is looser than the heat-balance test.

**Time integration.** BDF2 after one backward-Euler startup step, with 64 to 1024 steps per period. With N steps per period, BDF2 shifts the effective frequency of harmonic n by about (2πn/N)²/3: 0.3 % at 1ω and 3 % at 3ω with 64 steps, 0.02 % and 0.2 % with 256. Use at least 256 steps for 3ω results.

**Periodic convergence.** A run converges, at the earliest in its third cycle, when the combined error is ≤ 1. The combined error is the largest of:

- the change of the temperature history between successive cycles, relative to 2·10⁻⁷ K + 10⁻¹⁰·|T|;
- the change of the terminal DC to 3ω phasors, relative to an absolute tolerance plus 10⁻⁶·|U|. For the current the absolute tolerance is 10⁻¹⁰ A. For the voltage it is αmax·2·10⁻⁷ K, at least 10⁻¹² V, where αmax is the largest Seebeck coefficient of the model (4·10⁻¹¹ V for Bi₂Te₃): a temperature change at the temperature tolerance moves the terminal voltage by about that much. The value used is reported with the diagnostics;
- the normalized heat-balance residual.

Otherwise the run ends at the maximum cycle count (3 to 1000) as unconverged: its last cycle is shown, labelled UNCONVERGED and provisional, and can be inspected and exported like any result.

**Cycle extrapolation.** The approach to the periodic state is dominated by the slowest thermal mode, so successive cycle-start states differ by d(k) ≈ λ·d(k−1). When three successive cycle starts show 0 < λ < 0.995 with nearly parallel drifts (cosine > 0.999), the cycle start is moved to the extrapolated limit, by d·λ/(1 − λ) (at most 200·d), and the preceding step is shifted by the same amount so BDF2 continues smoothly. The jump only changes a starting state: convergence is still tested on two unextrapolated cycles with unchanged tolerances, the last two cycles of the budget are never extrapolated, and a jump that would leave the operating range or the validity of a material law is skipped. Without a periodic state (no thermal anchor and a net heat input), the drift does not decay and no jump is made. In the RC example, 30 Hz converges in 6 cycles and 300 Hz in 24; without extrapolation they need 123 and 890 cycles for the same impedance to 7 digits. The number of extrapolations is reported with the diagnostics.

**Checkpoints.** The first and last cycles of a periodic run are always saved. Intermediate cycles are saved every 5 cycles or after one second, less often when saving would exceed about 10 % of the run time. **Stop** keeps the latest saved complete cycle, labelled unconverged and provisional.

**Result checks.** Results outside the operating range are rejected, never clipped: temperature 1 to 2000 K, |V| ≤ 10⁶ V, |I| ≤ 10⁶ A, |J| and |q| ≤ 10¹² SI units, power ≤ 10¹² W.

## Frequency sweeps and Bode analysis

- Frequencies run from a minimum to a maximum over 2 to 100 points, with logarithmic or linear spacing. Bias, amplitude and phase stay fixed, and every frequency starts independently with no shared transient history.
- A frequency that reaches the maximum cycle count is kept as an unconverged point and the sweep continues. Unconverged points are excluded from the Bode plots. A solver error stops the sweep. **Stop** keeps the completed points and the latest saved cycle of the current point.
- **Quantity**: terminal voltage (source − sink), terminal current, impedance, Hall voltage V(P+) − V(P−) (when the field acts), or the temperature, potential, Jx, Jy, qx or qy at a probe given in % of the width and height. Temperature and potential snap to the nearest node; J and q use the containing cell.
- **Impedance** is U/I = (V(source) − V(sink)) / I at 1ω.
- **Harmonic**: 1ω, 2ω or 3ω.
- **Reference** for phase and normalization: the electrical excitation, the measured terminal current or voltage at 1ω, the excitation of a thermal side, or the time origin cos(nωt). References that are inactive in the model are disabled.
- **Phase** = φ(output, n) − n·φ(reference, 1), wrapped to ±180° or unwrapped. It is shown only when the raw output amplitude exceeds the phase threshold; unwrapping continues across points without a phase.
- **Normalization**: raw, divided by the reference amplitude, or divided by the reference amplitude to the power n.
- **Representation**: Magnitude / Phase, or the Real / Imaginary parts of magnitude·exp(i·phase).
- **Magnitude scale**: physical units, or dB as 20·log₁₀(module / reference). dB applies to the magnitude only and is unavailable for Real / Imaginary.
- Clicking a point, or choosing **Map / report frequency**, shows the spatial results for that frequency.
- **Export Bode CSV** writes magnitudes in physical units (never dB), phases, and the real and imaginary parts of magnitude·exp(i·phase) (`real_part`, `imag_part`).

## Results

- **Metrics**: terminal voltage U = V(source) − V(sink) and terminal current I entering the source (1ω peak amplitude and phase for periodic runs, the signed value for DC), the absorbed electrical power (U·I for DC, its mean over the saved cycle for periodic runs), temperature range, convergence and heat-balance diagnostics. In voltage control the current is the response. Under current drive a resistor shows a phase near 0°; a thermoelectric element shows a small negative (capacitive) phase.
- **Hall voltage**: V(P+) − V(P−) with R_xy = V_H/I and the field, when the field acts; otherwise — and the reason (see *Magnetic field (3D)*). The probes are drawn on the maps.
- **Spatial response**: maps of temperature, voltage, |J|, Jx, Jy, qx and qy at DC, 1ω, 2ω or 3ω, as Amplitude, Phase, Re or Im.
  - DC is the signed mean.
  - Temperature and voltage average the four complex nodal phasors of each cell before the representation is taken. Their colour scale spans the nodal values as well as the cell values, so its ends show the true extremes, such as a prescribed boundary temperature, which cell averages never reach.
  - |J| is the vector norm √(|Jx|² + |Jy|²), not a harmonic of instantaneous |J|.
  - Phase maps grey out cells whose amplitude is at or below max(absolute threshold, 10⁻⁶ × field peak). The absolute thresholds are 10⁻⁷ K, 10⁻¹² V, and 10⁻⁹ SI units for J and q.
- **Current arrows** show the current pattern at one instant, Re(Jₙ·exp(iθ)): direction and relative magnitude. DC shows the mean current. For a harmonic, θ is the phase nωt at which the terminal current of that harmonic peaks; without one (open circuit, or a harmonic absent from the terminals) it is the phase at which the current pattern is largest. The note under the map gives θ. Vectors below 10⁻⁸ of the strongest current harmonic (or 10⁻¹² A/m²) are hidden.
- **Probe**: click the map to move it. The readout under the map gives the displayed field at the probe, in the selected harmonic and representation: the nodal value for temperature and voltage, the mean of the adjacent cells for cell fields. DC runs also list the probe temperature and potential; periodic runs plot its temperature, and the terminal voltage or current, over the saved cycle. Reports use the same probe.
- **Spatial field · selected time**: the instantaneous field at any stored sample of the cycle.
- **Terminal harmonics**: DC to 3ω peak phasors of the terminal voltage U = V(source) − V(sink) and current I, referenced to cos(ωt), and the impedance Z = U₁/I₁ at 1ω (periodic runs with a terminal current).

## Examples

| Example | What it shows |
|---|---|
| DC · Joule heating / spatial profile | 1D resistive bar (Ny = 1) carrying 0.2 A DC between two 300 K ends: the Joule heating profile. |
| Cu / BiTe · layered | Copper and BiTe in series, driven by 0.1 A at 2 Hz: Peltier heat at the interface and the harmonic temperature response. |
| Narrow contact · current spreading | 0.1 A DC entering through the middle half of the left edge and spreading into the domain. |
| Homogeneous · Joule 2ω | Resistive block driven by 1 A at 2 Hz: Joule heating at DC and 2ω. |
| Nonlinear resistance · 3ω | β = 0.01 K⁻¹ with 0.2 A at 256 steps per period: the temperature-dependent resistance produces a 3ω voltage. |
| Open circuit · Seebeck DC | α = 200 µV/K between 300 K and 350 K in open circuit: the Seebeck voltage. |
| Thermoelectric module · Bi₂Te₃ n/p couple | A single thermoelectric couple as in a Peltier module (below). |
| RC circuit · thermoelectric impedance spectrum | A thermoelectric element with the impedance of an RC circuit, swept from 0.003 to 30 Hz (below). |
| Hall bar · Hall voltage | 1 mA DC along an 8 mm × 1 mm n-type semiconductor bar, 0.5 mm thick, in Bz = 1 T: V_H = R_H·I·B/t = −1.248 mV between the probes at mid-length. |
| Hall, p-Ge | 1 mA DC between 0.4 mm contacts at the middle of the top and bottom edges of a 4 mm × 10 mm plate of p-type Ge (Ge-p, reference: 8.4·10¹⁷ cm⁻³), 0.175 mm thick, in Bz = 1 T, with the side edges at 300 K: V_H = −R_H·I·B/t = −42.5 µV between probes at mid-height on the side edges (−42.2 µV computed; the narrow contacts barely short the Hall field). |

The **Example** selector names the loaded example until the model changes. Any edit, or opening a project, switches it to **Custom**; choosing an example, even the same one, loads it fresh.

### Thermoelectric module example

A 2D cut through the middle of one Bi₂Te₃ couple, with a depth of 1.4 mm and 25 × 34 cells of 0.2 mm × 0.1 mm:

- alumina plates 0.6 mm thick, copper leads and strap 0.3 mm thick, n and p legs 1.4 mm wide and 1.6 mm high, separated by a 1 mm air gap;
- current enters the left copper lead, rises through the n leg, crosses the top strap and returns down the p leg to the right lead, so the legs are electrically in series and thermally in parallel;
- default setup: a Peltier cooler at 4 A DC, with the bottom plate on a 300 K heat sink and the top plate insulated;
- as a generator: bottom 350 K, top temperature 300 K, open circuit.

The materials are loaded from `lib/Bi2Te3.json`, `lib/Bi2Te3_n_type.json`, `lib/Copper.json`, `lib/Alumina.json` and `lib/Air.json`. If a file is missing or unsuitable for its role (legs need the right Seebeck sign, copper must conduct, plates and gap must insulate), a built-in copy with the same values is used. Opened from disk, the files are read from `lib/catalog.js`. The model description states which source was used. A real module repeats this couple; voltage and heat pumping scale with the number of couples.

### RC circuit example: thermoelectric impedance spectrum

The application has no electrical capacitance: charge transport is resistive (∇·J = 0). A thermoelectric element nevertheless has the impedance of an RC circuit, because heat storage acts as a capacitor. This example builds such an element from two library materials, `lib/Bi2Te3.json` and `lib/Copper.json` (with built-in copies as for the module example), and computes its impedance spectrum.

**Structure.** A 1D stack along x (Ny = 1) with a 1 mm × 1 mm cross-section (Ly × depth), meshed with 0.05 mm cells:

| Part | Length | Role |
|---|---|---|
| Left end, source electrode | — | Heat sink at 300 K |
| Bi₂Te₃ layer | L = 0.2 mm (4 cells) | Electrical resistance and thermal resistance |
| Copper block | Lc = 1 mm (20 cells) | Heat capacity |
| Right end, sink electrode | — | Insulated (zero total flux) |

The drive is an AC current of 0.1 A peak with no DC bias, swept over 13 logarithmic points from 0.003 to 30 Hz, with 64 steps per period and at most 400 cycles. Loading the example sets the Bode quantity to **Impedance** and the representation to **Real / Imaginary**.

**How the RC arises.** The current I passes through the Bi₂Te₃ layer into the copper.

1. Peltier transport delivers heat α·T0·I to the copper block, where α is the Seebeck coefficient of Bi₂Te₃ and T0 = 300 K.
2. The copper conducts so well that it stays isothermal, at T0 + θ. It stores heat with capacity C_th and loses it back through the layer to the heat sink, through the thermal resistance R_th = L/(kA).
3. The temperature difference θ across the layer adds a Seebeck voltage α·θ to the ohmic drop.

The copper's own Seebeck coefficient drops out, for two reasons:

- At the Bi₂Te₃/copper junction the Peltier heat is (α − α_Cu)·T0·I. The insulated end has zero total heat flux, so the heat α_Cu·T0·I carried by the copper's current is deposited there. Together they give α·T0·I.
- The isothermal copper contributes no Seebeck voltage.

The element therefore behaves as Bi₂Te₃ measured against an α = 0 reference, which is how the application defines terminal voltages.

With θ the temperature rise of the copper, the energy balance and the terminal voltage are

```
C_th dθ/dt = α T0 I − θ / R_th
V(source) − V(sink) = R0 I + α θ
```

For a sinusoidal current, with phasors,

```
θ = α T0 R_th I / (1 + iωτ)

Z(ω) = R0 + R_TE / (1 + iωτ)

R0   = L/(σA) + Lc/(σ_Cu A)        ohmic resistance
R_th = L/(kA)                      thermal resistance of the layer
C_th = ρCp_Cu·Lc·A + ρCp·L·A/3     heat capacity (copper + one third of the layer)
R_TE = α² T0 R_th                  thermoelectric resistance
C_TE = C_th / (α² T0)              thermoelectric capacitance
τ    = R_th C_th = R_TE C_TE       time constant, corner frequency fc = 1/(2πτ)
```

This is the impedance of a resistor R0 in series with a parallel R_TE ∥ C_TE: the simple RC element of impedance spectroscopy, with the same form as an electrochemical cell without diffusion (series resistance plus charge-transfer resistance in parallel with the double-layer capacitance). The one third of the layer's heat capacity is the first-order correction for heat stored in the layer, whose temperature rises linearly from the heat sink to the junction.

Two limits have a physical meaning:

- **Z(0) = R0 + R_TE**: at low frequency the Seebeck voltage follows the Peltier heating fully.
- **Z(∞) = R0**: at high frequency the heat capacity holds the temperature constant, so only the ohmic resistance remains.

For the layer alone, R_TE / (L/σA) = α²σT0/k = ZT. Measuring the two limits therefore gives the figure of merit; this is the principle of ZT measurement by impedance spectroscopy and by the Harman method.

**Expected values** with the library properties (Bi₂Te₃: σ = 1.1·10⁵ S/m, k = 1.6 W/(m K), α = 200 µV/K, ρCp = 1.195·10⁶ J/(m³ K); copper: σ = 5.75·10⁷ S/m, ρCp = 3.45·10⁶ J/(m³ K)):

| Quantity | Value |
|---|---|
| R0 | 1.836 mΩ (1.818 mΩ layer + 0.017 mΩ copper) |
| R_th | 125 K/W |
| R_TE | 1.500 mΩ |
| ZT of the layer | 0.825 |
| C_th | 3.53·10⁻³ J/K |
| C_TE | 294 F |
| τ | 0.441 s |
| fc | 0.361 Hz |

The thermoelectric capacitance is huge because it is a thermal capacity divided by the small factor α²T0 = 1.2·10⁻⁵ V²/K.

**Reading the result.**

- **Real / Imaginary** (default):
  - Re(Z) falls from R0 + R_TE = 3.336 mΩ to R0 = 1.836 mΩ, crossing the midpoint at fc.
  - −Im(Z) peaks at R_TE/2 = 0.75 mΩ at fc.
  - Im(Z) is negative: the element is capacitive.
- **Magnitude / Phase**: |Z| steps down from 3.336 to 1.836 mΩ. The phase has its minimum of about −17° at fc·√(1 + R_TE/R0) ≈ 0.49 Hz.
- **Export Bode CSV** gives magnitude, phase and the real and imaginary parts at every frequency, for fitting or for plotting −Im against Re (a semicircle of diameter R_TE starting at R0).

**Simulation versus the formula.** The computed spectrum agrees with Z(ω) within 0.02 % below 0.1 Hz and within 0.5 % at every frequency:

| f (Hz) | Simulated Z (mΩ) | Formula (mΩ) |
|---|---|---|
| 0.003 | 3.3355 − 0.0125i | 3.3355 − 0.0125i |
| 0.030 | 3.3251 − 0.1244i | 3.3253 − 0.1239i |
| 0.300 | 2.7187 − 0.7340i | 2.7224 − 0.7374i |
| 3.0 | 1.8658 − 0.1750i | 1.8570 − 0.1778i |
| 30 | 1.8450 − 0.0188i | 1.8358 − 0.0180i |

The remaining difference at high frequency is physical, not numerical: refining the mesh or the time steps leaves it unchanged. Above a few hertz, heat no longer spreads uniformly: the layer's diffusion time L²/a ≈ 0.03 s and the copper's heat penetration depth approach the frequency scale. A single RC cannot represent this distributed response, which adds a small, slowly decaying tail (the thermal analogue of a Warburg element).

The lumped model is accurate here because the example satisfies its assumptions:

- the copper's diffusion time Lc²/a_Cu ≈ 9 ms is much shorter than τ, so the copper is isothermal;
- the layer stores only about 7 % as much heat as the copper.

**Linearity.** At 0.1 A the copper temperature swings by at most α·T0·R_th·I = 0.75 K. Joule heating, I²R0 ≈ 18 µW at the current peak, raises the mean temperature by about 1 mK and appears only at DC and 2ω. The 1ω impedance is therefore independent of the amplitude as long as the temperature swing stays small compared with T0.

**Changing the circuit.** Edit the geometry or the Bi₂Te₃ properties; the uniform grid requires lengths that are whole numbers of cells.

| Change | Effect |
|---|---|
| Thicker Bi₂Te₃ (L) | R0, R_TE and τ increase in proportion. R_TE/R0 stays near ZT. |
| Longer copper block (Lc) | C_th, C_TE and τ increase; fc decreases. R0 barely changes. |
| Larger cross-section (A = Ly × depth) | Every resistance divides by A and C_TE multiplies by A; τ and fc do not change. |
| Different layer material | R_TE/R0 follows α²σT0/k; τ follows L·Lc·ρCp_Cu/k. |

**Run time and convergence.** Each frequency starts from 300 K and must reach a periodic state. Transients decay with τ, so low frequencies converge in the minimum of 3 cycles. At higher frequencies the slow transient spans many cycles (123 at 30 Hz), and cycle extrapolation removes it: every point of the sweep converges within 3 to 8 cycles, and the full sweep takes a few seconds in a browser. Frequencies well above 30 Hz still need somewhat more cycles (24 at 300 Hz); raise **Maximum cycles** if points come back unconverged.

## Material library

`lib/index.json` lists the 18 files offered under **Materials → Select preset…**:

- **Metals:** Aluminum, Copper, Gold and Platinum.
- **Semimetal:** Bismuth (polycrystalline), with the largest Hall, Nernst and Righi–Leduc responses in the library. It is valid for weak fields only (|B| up to about 0.2 T).
- **Thermoelectrics:** Bi₂Te₃ (p-type benchmark), an illustrative n-type Bi₂Te₃ (the benchmark with the Seebeck sign reversed) and PbTe.
- **Insulators:** Air and Alumina.
- **Silicon and germanium,** p- and n-type, lightly doped (10¹⁵ cm⁻³) and heavily doped (10¹⁹ cm⁻³): `Si_n_1e15`, `Si_n_1e19`, `Si_p_1e15`, `Si_p_1e19`, `Ge_n_1e15`, `Ge_n_1e19`, `Ge_p_1e15`, `Ge_p_1e19`.

Each file documents its values in `notes` and `sources`. These are starting points, not specimen-specific calibrations.

The Si and Ge presets are model presets built from standard data:
- density, heat capacity, thermal conductivity and effective densities of states from the Ioffe semiconductor archive;
- mobility versus doping from the Caughey–Thomas fit (Si) or the Ioffe/Hilsum formulas (Ge);
- σ = n·e·μ;
- the Seebeck coefficient and its slope from a single parabolic band with Fermi–Dirac statistics;
- the resistivity slope β of the lightly doped crystals from the lattice mobility law linearized at 300 K (Si: T^−2.4 electrons, T^−2.2 holes; Ge: T^−1.66, T^−2.33). The heavily doped crystals keep β = 0, because their impurity-limited mobility changes little near 300 K.

Phonon drag, which adds roughly 10–30 % to the Seebeck coefficient of lightly doped Si at 300 K, is not included, and neither is the lower thermal conductivity of heavily doped crystals.

### Magnetic coefficients

Every file carries the four magnetic coefficients of the 3D edition (see *Magnetic field (3D)*). A coefficient is 0 only where the effect is negligible (the Nernst coefficient of the metals) or impossible (the insulators).

| Material | R_H (m³/C) | N (V/(K·T)) | S (1/T) | m (1/T²) | Basis |
|---|---|---|---|---|---|
| Air (1 atm, still) | 0 | 0 | 0 | 0 | insulator: no current, no effect |
| Alumina (96% Al2O3) | 0 | 0 | 0 | 0 | insulator: no current, no effect |
| Aluminum | −3.43·10⁻¹¹ | 0 | −0.00126 | 1.58·10⁻⁶ | R_H measured; S = σ·R_H; m Kohler bound |
| Bi2Te3 (p-type benchmark) | 3.12·10⁻⁷ | 1.59·10⁻⁶ | 0.013 | 0.000307 | R_H = ±1/(ne); N, S, m model estimates |
| Bi2Te3 n-type (illustrative) | −3.12·10⁻⁷ | 1.59·10⁻⁶ | −0.013 | 0.000307 | R_H = ±1/(ne); N, S, m model estimates |
| Bismuth (polycrystalline) | −4.91·10⁻⁷ | 6.4·10⁻⁶ | −0.307 | 0.094 | R_H, N measured (polycrystal); S = σ·R_H; m estimate; weak fields (B ≲ 0.2 T) |
| Copper | −5.17·10⁻¹¹ | 0 | −0.00297 | 8.83·10⁻⁶ | R_H measured; S = σ·R_H; m Kohler bound |
| Ge n-type, 1e15 cm-3 (lightly doped) | −0.00624 | 1.97·10⁻⁵ | −2.18·10⁻⁶ | 0.0571 | R_H = ±1/(ne); N, S, m model estimates |
| Ge n-type, 1e19 cm-3 (heavily doped) | −6.24·10⁻⁷ | 1.76·10⁻⁶ | −0.000231 | 0.000363 | R_H = ±1/(ne); N, S, m model estimates |
| Ge p-type, 1e15 cm-3 (lightly doped) | 0.00624 | 9.01·10⁻⁶ | 4.57·10⁻⁷ | 0.012 | R_H = ±1/(ne); N, S, m model estimates |
| Ge p-type, 1e19 cm-3 (heavily doped) | 6.24·10⁻⁷ | 7.78·10⁻⁷ | 5.74·10⁻⁵ | 6·10⁻⁵ | R_H = ±1/(ne); N, S, m model estimates |
| Gold | −7.2·10⁻¹¹ | 0 | −0.00318 | 1.01·10⁻⁵ | R_H tabulated; S = σ·R_H; m Kohler bound |
| PbTe (room-temperature model) | 6.24·10⁻⁷ | 1.74·10⁻⁶ | 0.00883 | 0.000355 | R_H = ±1/(ne); N, S, m model estimates |
| Platinum | −2.4·10⁻¹¹ | 0 | −0.000221 | 4.88·10⁻⁸ | R_H approximate; S = σ·R_H; m Kohler bound |
| Si n-type, 1e15 cm-3 (lightly doped) | −0.00624 | 6.83·10⁻⁶ | −1.17·10⁻⁷ | 0.00686 | R_H = ±1/(ne); N, S, m model estimates |
| Si n-type, 1e19 cm-3 (heavily doped) | −6.24·10⁻⁷ | 5.67·10⁻⁷ | −8.86·10⁻⁶ | 4.36·10⁻⁵ | R_H = ±1/(ne); N, S, m model estimates |
| Si p-type, 1e15 cm-3 (lightly doped) | 0.00624 | 2.42·10⁻⁶ | 1.47·10⁻⁸ | 0.000862 | R_H = ±1/(ne); N, S, m model estimates |
| Si p-type, 1e19 cm-3 (heavily doped) | 6.24·10⁻⁷ | 2.71·10⁻⁷ | 2.17·10⁻⁶ | 9.44·10⁻⁶ | R_H = ±1/(ne); N, S, m model estimates |

- **Metals.**
  - Hall coefficients are measured room-temperature low-field values; platinum's is approximate.
  - Righi–Leduc uses the Wiedemann–Franz law applied to the Hall components, S ≈ σ·R_H, which holds where electrons carry most of the heat.
  - Magnetoresistance is the Kohler-scale bound m ≈ (σ·R_H)²; a real Fermi surface gives less. It is tiny at room temperature.
  - The Nernst coefficient of a simple metal is of order 10⁻⁹ V/(K·T) with no established sign, so it is set to 0.
- **Bismuth.**
  - R_H, σ and N are measured on one polycrystalline sample (Porter et al., 2024).
  - S = σ·R_H follows the measured thermal Hall coefficient of bismuth, which equals its Hall mobility (Kobayashi et al., 2012).
  - m ≈ μ_H² is an order-of-magnitude estimate.
  - Bismuth's responses become nonlinear above about 0.2 T at 300 K, and its single crystals are strongly anisotropic.
- **Semiconductors (Bi₂Te₃, PbTe, Si, Ge).**
  - R_H = ∓1/(ne) with a Hall factor of 1; measured Hall factors differ from 1 by up to about 30 %.
  - N, S and m come from the single-parabolic-band Boltzmann model with Fermi–Dirac statistics and acoustic-phonon scattering (τ ∝ E^−1/2), the model that gives the Si and Ge Seebeck coefficients. For Bi₂Te₃ and PbTe, the reduced Fermi level is fitted to the file's Seebeck coefficient.
  - In this model N = (k_B/e)·μ_H·[⟨τx⟩/⟨τ⟩ − ⟨τ²x⟩/⟨τ²⟩], m follows from ⟨τ³⟩⟨τ⟩ − ⟨τ²⟩², and S = (κ_e/κ)·μ_H with κ_e = L·σ·T.
  - These are order-of-magnitude estimates. Multiple anisotropic valleys and mixed scattering change them. In the heavily doped crystals, ionized-impurity scattering would make N smaller or negative, so there the value mainly shows its small size. Replace estimates with measured values when you have them.
- **Sign convention.** N follows this program's E_y = N·B·∂T/∂x. Part of the literature uses the opposite, "Gerlach" convention: bismuth's −6.4 µV/(K·T) there is +6.4 µV/(K·T) here.
- **Response strength.** The Hall angle μ_H·B = σ·|R_H|·B shows how strongly a material responds. At 1 T it is:
  - 0.0002 (platinum) to 0.003 (copper, gold) for the metals;
  - 0.03 for Bi₂Te₃ and PbTe;
  - 0.13 for lightly doped n-Si;
  - 0.31 for bismuth;
  - 0.39 for lightly doped n-Ge.
- **The effects couple.** A bismuth bar shows this well, because all four effects interact strongly there:
  - With 1000 K/m along a 2 mm wide bar at 0.2 T and insulated long edges, the Righi–Leduc temperature difference (0.12 K) adds a Seebeck voltage of −8.6 µV. The Nernst voltage is then −11.1 µV, more than four times the isothermal −2.6 µV.
  - In a Hall measurement on the same bar, the Ettingshausen temperature difference adds 3 % to the Hall voltage.
  - The solver includes these couplings automatically; to see one effect alone, hold the transverse edges at fixed temperature.

### Material file format

```json
{
  "format": "TE_2D_material",
  "version": 1,
  "referenceTemperature": 300,
  "units": { "rho": "kg/m^3", "Cp": "J/(kg K)", "k": "W/(m K)", "sigma": "S/m",
             "alpha": "V/K", "beta": "1/K", "alphaSlope": "V/K^2",
             "hall": "m^3/C", "nernst": "V/(K T)", "righiLeduc": "1/T", "magnetoresistance": "1/T^2" },
  "material": {
    "name": "Example", "rho": 7740, "Cp": 154.4, "k": 1.6, "sigma": 110000,
    "alpha": 0.0002, "beta": 0, "alphaSlope": 0,
    "hall": 3.1e-7, "nernst": 0, "righiLeduc": 0, "magnetoresistance": 0, "color": "#73d8d0"
  },
  "notes": "Assumptions and validity.",
  "sources": [ { "url": "https://…", "properties": "Which values come from this source." } ]
}
```

- Values are in SI units: α in V/K and α′ in V/K². The editor displays them in µV/K and µV/K².
- rho, Cp, k and sigma must be positive. beta, alphaSlope and the four magnetic coefficients are optional and default to 0.
- The name has 1 to 200 characters, the colour is `#RRGGBB`, and `referenceTemperature`, if present, must be 300.
- A bare material object without the wrapper is also accepted.
- The format name stays `TE_2D_material`: the 2D application reads the same files and ignores the magnetic keys.

**Add material json** imports such a file (up to 64 KB). To offer a material under **Select preset…**, place its file in `lib/` and run `python lib/build_catalog.py`, which rewrites `lib/index.json` and `lib/catalog.js` (the copy used when `index.html` is opened from disk).

## Models, projects and exports

A project is a ZIP of JSON files. It always holds the model: geometry, materials, boundary conditions and solver settings, including the magnetic field and the Hall probes (`"version": 3`, scalar material values, 64 to 1024 steps per period). It may also hold results.

**Save project** (toolbar) is available whenever the inputs are valid and nothing is running:

- If the displayed results belong to the current inputs, it saves the complete project, the same file as **Save project / complete results ZIP** under Results → Export.
- Otherwise (nothing computed yet, or inputs edited since the run), it saves the model and settings only, and the status line says so. Such a project is like an example: share it, open it and run it.

**Import project** opens either kind. A project without results loads the model ready to run. A project with results restores:

- the model and all retained results;
- sweep points and the selected frequency;
- the probe, field, harmonic, representation, arrows and time position;
- the Bode settings, including the representation.

Results can be inspected and exported without recalculation, and the model can be edited and run again. Import the ZIP as downloaded; do not extract it first.

Project ZIP contents:

- `project.json`: format metadata and the saved view.
- Project without results: `model.json` and `README.txt`.
- Single run:
  - `model.json`, `results.json` (full precision), `report.html`, `figures/*.svg`;
  - CSV files `nodes`, `cells`, `terminal`, `terminal_harmonics`, `histories/*` and `harmonics/*`;
  - `manifest.json`, `README.txt`.
- Sweep:
  - `sweep-model.json`;
  - `sweep-status.json`, with the requested and retained frequencies and the Bode settings;
  - `bode.csv`, and `report.html` with the Bode summary followed by the selected frequency;
  - one `frequency-NNN/` folder per retained point, containing the single-run files;
  - `README.txt`.

Export rules:

- Exports contain the computed model, not later input edits. After any input change, exports are disabled until the next run, including while browsing sweep points.
- Periodic results hold only the last saved complete cycle.
- Unconverged and stopped results stay labelled provisional, and importing never resumes a calculation.
- ZIP entries are stored without compression.

Import requirements:

- Import accepts project ZIPs containing `project.json` (format `thermoelectric-lab-project`, version 3, kind `model`, `single` or `sweep`) with version-3 models. 3D files use version 3 so that the 2D application rejects them instead of ignoring the field, and the 3D application reads only 3D files. Project files are named `TE_3D_<date>_<time>.zip`. Files are stored or Deflate-compressed. Deflate requires browser support for raw Deflate decompression.
- Encrypted, split and ZIP64 archives, and results ZIPs without `project.json`, are rejected.
- Limits: 2 GiB per archive, 256 MiB of JSON, and the retained-data budget.
- Archived HTML and scripts are never executed.

Other exports:

- **Full PDF report** opens a printable report; allow pop-ups, then choose **Save as PDF / Print**.
  - It covers model and convergence (including the linear solvers used), materials and boundary conditions, the terminal voltage and current spectra with the impedance and mean power, the Hall voltage when the field acts, the probe, the equations, and every field map in every representation. Maps mark the electrodes and the Hall probes.
  - Sweep reports start with a Bode summary that follows the selected representation.
  - Reports use a fixed paper palette regardless of the interface theme.
- **Export results JSON**: the displayed result, or the whole sweep.
- **Spectrum CSV**: terminal voltage and current phasors from DC to 3ω (the current columns follow the voltage columns; `terminal_harmonics.csv` in the project ZIP has the same data).
- **Export data · all fields**: the project ZIP.
- **Export Bode CSV**: see *Frequency sweeps and Bode analysis*.

## Limits

- Mesh: Nx ≥ 2, Ny ≥ 1, at most 1600 nodes.
- 1 to 12 materials.
- Steps per period 64 to 1024; maximum cycles 3 to 1000; sweeps of 2 to 100 points.
- Retained periodic data for all sweep points together must fit an estimated 256 MiB.
- Magnetic field: uniform, static and perpendicular (Bz only), |Bz| ≤ 100 T. Magnetic coefficients are constant; the only field dependence of the resistivity is the m·B² term.

## Tests

With Node.js 24 or newer, run `node tests/regression.cjs` (58 checks, about fifteen seconds). The suite covers solver smoke cases and the terminal sign convention, an ideal Peltier leg against its analytic solution, convergence of the module example beyond its optimum current, electrode placement checks, cycle extrapolation and the terminal-voltage tolerance, worker encoding and decoding, spatial phasors, colour-scale ranges and the probe readout, display-state handling, projects with and without results, model and project version checks, rejection of results ZIPs without `project.json`, malformed archive rejection, the material limit after runs, start-up of the full page scripts with the Example selector, agreement of the Solver-tab equations with the report guide, and, for the magnetic field: the banded direct solver, zero-field equivalence, the Hall bar and van der Pauw, Nernst, Ettingshausen and Righi–Leduc benchmarks, Onsager symmetry and the energy balance in a field, validation of the magnetic inputs, the Hall voltage in results, Bode rows, reports and CSV, the Hall-bar example, and the material library: every `lib/` file must parse and validate, and the built-in fallback copies must equal their files. It also covers the terminal current, power and impedance in results, reports and CSVs; Hall voltages reported only when the field acts; an exhausted cycle budget shown as an unconverged result rather than an error; validation after painting and filling; saved-view choices; Bode unwrapping across gaps and the real and imaginary CSV columns; current arrows at the phase of the terminal current; the linear-solver labels; `lib/catalog.js` against the files and as the library of a page opened from disk; consistent metal and silicon data; the 200-character name limit; optional startup scripts; the 256-step 3ω example; the Hall, p-Ge example; and the export menu. UI tests use DOM and canvas test doubles.
