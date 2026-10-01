# Material library

This folder holds the material presets of Thermoelectric Lab. Keep it as `lib/` beside `index.html`. The same files work in the 2D and the 3D application.

## Contents

- **19 material files**, one material each, with properties referenced to 300 K:
  - metals: `Aluminum`, `Copper`, `Gold`, `Platinum`;
  - semimetal: `Bismuth` (polycrystalline; weak fields only, |B| up to about 0.2 T);
  - thermoelectrics: `Bi2Te3` (p-type benchmark), `Bi2Te3_n_type` (illustrative: the benchmark with the Seebeck sign reversed), `PbTe`;
  - insulators: `Air`, `Alumina`;
  - silicon and germanium model presets, p- and n-type, lightly (10¹⁵ cm⁻³) and heavily (10¹⁹ cm⁻³) doped: `Si_n_1e15`, `Si_n_1e19`, `Si_p_1e15`, `Si_p_1e19`, `Ge_n_1e15`, `Ge_n_1e19`, `Ge_p_1e15`, `Ge_p_1e19`;
  - germanium reference: `Ge_p_reference` (p-type, 8.4·10¹⁷ cm⁻³ acceptors), the material of the *Hall, p-Ge* example.
- **`index.json`**: the list of files the application offers. It is read at startup.
- **`build_catalog.py`**: rebuilds `index.json` after you add, rename or remove files.
- **`catalog.js`**: a JavaScript snapshot of all records, also written by `build_catalog.py`. `index.html` loads it, so the presets and examples also work when the page is opened directly from disk.

Every material file documents its values in `notes` and `sources`. The values are starting points, not specimen-specific calibrations. A slope or magnetic coefficient of 0 means the effect is assumed constant or switched off, not that it was measured to be zero.

## Using the library

On the **Materials** tab:

- **Select preset…** lists the files in `index.json` by material name (a file missing from `catalog.js` is shown by its file name, without `.json` and with spaces for underscores). Choosing one reads the file and appends it as a new material card, which you can edit like any other. The selector then returns to *Select preset…*, and existing cards are unchanged.
- **Add material json** adds one material file from anywhere on your computer, up to 64 KB, as a new card. The file is not copied into `lib/`.
- **+ Add material** adds an empty card to fill in by hand.

A model holds at most 12 materials. The preset list and the two add buttons are disabled while a simulation is running.

The values are copied into the model when a material is added. A saved project therefore carries its materials with it: it opens and runs without the library, and later edits to the library never change an existing model. To use updated library values, add the preset again and paint it where it is needed.

**Serving the application.** Served over HTTP (for example `python3 -m http.server 8000`), the application reads the files in `lib/`. When `index.html` is opened directly from disk, browsers block these reads, so the list and the records come from `catalog.js` instead; rebuild it with `build_catalog.py` after editing any file, or the page opened from disk keeps the old values. The thermoelectric module and RC circuit examples also carry built-in copies of the five library materials they need (`Bi2Te3`, `Bi2Te3_n_type`, `Copper`, `Alumina`, `Air`), used only when a file is missing or unsuitable. If you change one of these five files, update its copy in `assets/ui-model.js` (`app.libraryCopies`) as well; the regression suite checks that each copy equals its file.

## File format

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
    "hall": 3.1e-7, "nernst": 0, "righiLeduc": 0, "magnetoresistance": 0,
    "color": "#73d8d0"
  },
  "notes": "Composition, temperature range, assumptions.",
  "sources": [ { "url": "https://…", "properties": "Which values come from this source." } ]
}
```

The `material` object:

| Key | Required | Unit | Meaning |
|---|---|---|---|
| name | yes | | 1 to 200 characters |
| rho | yes | kg/m³ | mass density, positive |
| Cp | yes | J/(kg K) | specific heat, positive |
| k | yes | W/(m K) | thermal conductivity, positive |
| sigma | yes | S/m | electrical conductivity (not resistivity) at 300 K, positive |
| alpha | yes | V/K | Seebeck coefficient at 300 K |
| beta | no, default 0 | 1/K | resistivity slope: ρ(T) = [1 + β(T − 300)]/σ |
| alphaSlope | no, default 0 | V/K² | Seebeck slope: α(T) = α + α′(T − 300) |
| hall | no, default 0 | m³/C | Hall coefficient R_H: E_y = R_H·B·J_x |
| nernst | no, default 0 | V/(K·T) | Nernst coefficient N: E_y = N·B·∂T/∂x without current |
| righiLeduc | no, default 0 | 1/T | Righi–Leduc coefficient S: ∂T/∂y = S·B·∂T/∂x without current |
| magnetoresistance | no, default 0 | 1/T² | ρ_xx = ρ·(1 + m·B²) |
| color | no, default `#73d8d0` | | `#RRGGBB`, the painting colour |

- All values are SI numbers and must be finite. The editor displays α in µV/K and α′ in µV/K²; the file stores V/K and V/K².
- `referenceTemperature`, if present, must be 300. A bare material object without the wrapper is also accepted by **Add material json**.
- The four magnetic coefficients are used only by the 3D application; the 2D application ignores them. The Ettingshausen effect needs no key of its own, because it follows from the Nernst coefficient (Bridgman relation).
- `units`, `notes` and `sources` document the file and are not read by the application. Keep them so the values stay traceable.

## Adding or changing a material

1. Copy one of the material files, give it a new filename and edit the values, notes and sources.
2. Keep `"format": "TE_2D_material"` and `"version": 1`: `build_catalog.py` rejects other values.
3. Run `python lib/build_catalog.py`. It checks every file and rewrites `index.json` and `catalog.js`, listing the files alphabetically. `catalog.js` is what the page reads when opened from disk. When the page is served over HTTP you can also edit the `files` array of `index.json` by hand; no directory listing or server-side code is needed.
4. If you added, renamed or removed a file, update `app.libraryFallback` in `assets/app.js` to the new `index.json` list. It is used only when neither `catalog.js` nor `index.json` can be read; the regression suite checks that the two lists agree.
5. Reload the application.

## Magnetic coefficients and the Si and Ge presets

The main README (*Material library → Magnetic coefficients*) tabulates the four magnetic coefficients of every file with their basis:

- metals: measured Hall coefficients, Righi–Leduc from the Wiedemann–Franz law, a Kohler-scale magnetoresistance bound, and a negligible Nernst coefficient (0);
- bismuth: Hall and Nernst coefficients measured on a polycrystalline sample, Righi–Leduc equal to the Hall mobility as measured;
- Bi₂Te₃, PbTe, silicon and germanium: Hall coefficients from stated carrier densities, and Nernst, Righi–Leduc and magnetoresistance estimated with the single-band Boltzmann model.

Nernst signs follow this program's convention, E_y = N·B·∂T/∂x; part of the literature (the "Gerlach" convention) uses the opposite sign.

It also explains how the Si and Ge presets are built: Ioffe data, mobility versus doping, and a Seebeck coefficient from Fermi–Dirac statistics. Each file's `notes` state the same assumptions and their limits.
