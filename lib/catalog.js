// Generated from lib/*.json by build_catalog.py; do not edit directly.
globalThis.TE_MATERIAL_CATALOG = {
  "Air.json": {
    "format": "TE_2D_material",
    "version": 1,
    "referenceTemperature": 300,
    "units": {
      "rho": "kg/m^3",
      "Cp": "J/(kg K)",
      "k": "W/(m K)",
      "sigma": "S/m",
      "alpha": "V/K",
      "beta": "1/K",
      "alphaSlope": "V/K^2",
      "hall": "m^3/C",
      "nernst": "V/(K T)",
      "righiLeduc": "1/T",
      "magnetoresistance": "1/T^2"
    },
    "material": {
      "name": "Air (1 atm, still)",
      "rho": 1.1614,
      "Cp": 1007,
      "k": 0.0263,
      "sigma": 1e-14,
      "alpha": 0,
      "beta": 0,
      "alphaSlope": 0,
      "color": "#46535f",
      "hall": 0,
      "nernst": 0,
      "righiLeduc": 0,
      "magnetoresistance": 0
    },
    "notes": "Dry air at 300 K and atmospheric pressure, treated as a stagnant conducting solid: convection and radiation are not modeled. Density, Cp and k are held constant (density actually varies as 1/T). sigma = 1e-14 S/m is the order of magnitude of fair-weather air conductivity near the ground, which varies with ionization, humidity and aerosols; any value this small behaves as an ideal electrical insulator in this app. alpha = 0, beta = 0 and alphaSlope = 0 are modeling assumptions. Magnetic (3D): hall, nernst, righiLeduc and magnetoresistance = 0: an insulator carries no current, so these coefficients have no effect.",
    "sources": [
      {
        "url": "https://me.psu.edu/cimbala/me405/Links/Appendix_10_11.pdf",
        "properties": "Table A.11 (abstracted from Schmidt et al., 1984): density, Cp and k at 300 K."
      },
      {
        "url": "https://nap.nationalacademies.org/read/898/chapter/5",
        "properties": "Order of magnitude of the fair-weather electrical conductivity of air near the surface (1e-14 S/m)."
      }
    ]
  },
  "Alumina.json": {
    "format": "TE_2D_material",
    "version": 1,
    "referenceTemperature": 300,
    "units": {
      "rho": "kg/m^3",
      "Cp": "J/(kg K)",
      "k": "W/(m K)",
      "sigma": "S/m",
      "alpha": "V/K",
      "beta": "1/K",
      "alphaSlope": "V/K^2",
      "hall": "m^3/C",
      "nernst": "V/(K T)",
      "righiLeduc": "1/T",
      "magnetoresistance": "1/T^2"
    },
    "material": {
      "name": "Alumina (96% Al2O3)",
      "rho": 3750,
      "Cp": 750,
      "k": 24,
      "sigma": 1e-12,
      "alpha": 0,
      "beta": 0,
      "alphaSlope": 0,
      "color": "#d9d4c7",
      "hall": 0,
      "nernst": 0,
      "righiLeduc": 0,
      "magnetoresistance": 0
    },
    "notes": "96% alumina substrate, the usual plate material of thermoelectric modules. Datasheet values at 25 \u00b0C are used at nominal 300 K; density, Cp and k are held constant (the same datasheet gives k halving to 12 W/(m K) at 300 \u00b0C). The datasheet specifies volume resistivity > 1e14 ohm cm at 25 \u00b0C, so sigma = 1e-12 S/m is an upper bound; any value this small behaves as an ideal electrical insulator in this app. alpha = 0 (no current flows in the insulator), beta = 0 and alphaSlope = 0 are modeling assumptions. Magnetic (3D): hall, nernst, righiLeduc and magnetoresistance = 0: an insulator carries no current, so these coefficients have no effect.",
    "sources": [
      {
        "url": "https://www.maruwa-g.com/e/products/ceramic/upfiles/alumina_01_en_1.pdf",
        "properties": "Grade HA-96-2 (96% Al2O3): bulk density 3.75 g/cm^3, thermal conductivity and specific heat at 25 \u00b0C, volume resistivity at 25 \u00b0C."
      }
    ]
  },
  "Aluminum.json": {
    "format": "TE_2D_material",
    "version": 1,
    "referenceTemperature": 300,
    "units": {
      "rho": "kg/m^3",
      "Cp": "J/(kg K)",
      "k": "W/(m K)",
      "sigma": "S/m",
      "alpha": "V/K",
      "beta": "1/K",
      "alphaSlope": "V/K^2",
      "hall": "m^3/C",
      "nernst": "V/(K T)",
      "righiLeduc": "1/T",
      "magnetoresistance": "1/T^2"
    },
    "material": {
      "name": "Aluminum",
      "rho": 2700,
      "Cp": 897,
      "k": 237,
      "sigma": 37735849.056603774,
      "alpha": -1.7e-06,
      "beta": 0,
      "alphaSlope": 0,
      "color": "#96b8d5",
      "hall": -3.43e-11,
      "nernst": 0,
      "righiLeduc": -0.001294,
      "magnetoresistance": 1.68e-06
    },
    "notes": "Room-temperature bulk approximation: supplier thermal/density data and 293.15 K conductivity used unchanged at nominal 300 K. beta=0 and alphaSlope=0 deliberately assume constant transport coefficients; select Custom to supply measured slopes. Magnetic (3D): hall = -3.43e-11 m^3/C, the room-temperature low-field value (Hurd, via Yates et al.); aluminium is a two-band metal whose Hall coefficient changes sign at high fields, which this constant does not describe. righiLeduc = sigma*hall = -0.00129 1/T (Wiedemann-Franz law for the Hall components; electrons carry most of the heat). magnetoresistance = (sigma*hall)^2 = 1.7e-06 1/T^2, a Kohler-scale order-of-magnitude upper bound (zero for free electrons; the real value depends on the Fermi surface). nernst = 0: Mott-type estimates give |N| of order 1e-9 V/(K T) with a sign that is not established, negligible here.",
    "sources": [
      {
        "url": "https://www.goodfellow.com/global/material/metals/aluminium",
        "properties": "rho, Cp, k, resistivity"
      },
      {
        "url": "https://patents.google.com/patent/US8696989B2/en",
        "properties": "Table 1: representative Seebeck coefficient."
      },
      {
        "url": "https://arxiv.org/pdf/cond-mat/0702554",
        "properties": "Table I: experimental low-field Hall coefficients at room temperature, Cu -5.17e-11 and Al -3.43e-11 m^3/C (compiled from C. M. Hurd, The Hall Effect in Metals and Alloys, 1972)."
      },
      {
        "url": "https://doi.org/10.1103/PhysRevLett.84.2219",
        "properties": "Zhang et al. (2000): the Wiedemann-Franz law holds for the Hall components in copper, the basis of the Righi-Leduc estimate S = sigma*R_H."
      }
    ]
  },
  "Bi2Te3.json": {
    "format": "TE_2D_material",
    "version": 1,
    "referenceTemperature": 300,
    "units": {
      "rho": "kg/m^3",
      "Cp": "J/(kg K)",
      "k": "W/(m K)",
      "sigma": "S/m",
      "alpha": "V/K",
      "beta": "1/K",
      "alphaSlope": "V/K^2",
      "hall": "m^3/C",
      "nernst": "V/(K T)",
      "righiLeduc": "1/T",
      "magnetoresistance": "1/T^2"
    },
    "material": {
      "name": "Bi2Te3 (p-type benchmark)",
      "rho": 7740,
      "Cp": 154.4,
      "k": 1.6,
      "sigma": 110000.0,
      "alpha": 0.0002,
      "beta": 0,
      "alphaSlope": 0,
      "color": "#73d8d0",
      "hall": 3.121e-07,
      "nernst": 1.59e-06,
      "righiLeduc": 0.013,
      "magnetoresistance": 0.000307
    },
    "notes": "Constant-property COMSOL thermoelectric-leg benchmark, used at nominal 300 K. Positive Seebeck denotes this p-type model. beta=0 and alphaSlope=0 are constant-property assumptions. Real Bi2Te3 depends on doping and orientation; not a universal bulk standard. Magnetic (3D): hall = +1/(n e) as before (Hall factor 1). nernst, magnetoresistance and righiLeduc are estimates from the single-parabolic-band Boltzmann model with Fermi-Dirac statistics and acoustic-phonon scattering (tau proportional to E^-1/2), at reduced Fermi level 0.07 fitted to this file's Seebeck coefficient: Hall factor 1.13, Hall mobility 389 cm^2/Vs; nernst = (kB/e)*mu_H*[<tau x>/<tau> - <tau^2 x>/<tau^2>] = 1.59e-06 V/(K T); magnetoresistance = 0.000307 1/T^2; righiLeduc = (kappa_e/kappa)*mu_H = 0.013 1/T with kappa_e = L*sigma*T, L = 1.62e-08 W Ohm/K^2. Signs follow this program's convention E_y = N*B*dT/dx; the 'Gerlach' convention used in parts of the literature has the opposite sign. These are order-of-magnitude estimates: multiple anisotropic valleys and mixed scattering change them. Replace them with measured values when available.",
    "sources": [
      {
        "url": "https://doc.comsol.com/6.3/doc/com.comsol.help.models.heat.thermoelectric_leg/thermoelectric_leg.html",
        "properties": "All five scalar properties from Table 1; zero slopes are modeling assumptions."
      }
    ]
  },
  "Bi2Te3_n_type.json": {
    "format": "TE_2D_material",
    "version": 1,
    "referenceTemperature": 300,
    "units": {
      "rho": "kg/m^3",
      "Cp": "J/(kg K)",
      "k": "W/(m K)",
      "sigma": "S/m",
      "alpha": "V/K",
      "beta": "1/K",
      "alphaSlope": "V/K^2",
      "hall": "m^3/C",
      "nernst": "V/(K T)",
      "righiLeduc": "1/T",
      "magnetoresistance": "1/T^2"
    },
    "material": {
      "name": "Bi2Te3 n-type (illustrative)",
      "rho": 7740,
      "Cp": 154.4,
      "k": 1.6,
      "sigma": 110000.0,
      "alpha": -0.0002,
      "beta": 0,
      "alphaSlope": 0,
      "color": "#ae92d9",
      "hall": -3.121e-07,
      "nernst": 1.59e-06,
      "righiLeduc": -0.013,
      "magnetoresistance": 0.000307
    },
    "notes": "Illustrative n-type partner: same scalar properties as the p-type benchmark with ONLY the Seebeck sign reversed. This is a constructed demonstration preset, not measured n-type material data. Both slopes are zero. Magnetic (3D): hall = -1/(n e) as before (Hall factor 1). nernst, magnetoresistance and righiLeduc are estimates from the single-parabolic-band Boltzmann model with Fermi-Dirac statistics and acoustic-phonon scattering (tau proportional to E^-1/2), at reduced Fermi level 0.07 fitted to this file's Seebeck coefficient: Hall factor 1.13, Hall mobility 389 cm^2/Vs; nernst = (kB/e)*mu_H*[<tau x>/<tau> - <tau^2 x>/<tau^2>] = 1.59e-06 V/(K T); magnetoresistance = 0.000307 1/T^2; righiLeduc = (kappa_e/kappa)*mu_H = -0.013 1/T with kappa_e = L*sigma*T, L = 1.62e-08 W Ohm/K^2. Signs follow this program's convention E_y = N*B*dT/dx; the 'Gerlach' convention used in parts of the literature has the opposite sign. These are order-of-magnitude estimates: multiple anisotropic valleys and mixed scattering change them. Replace them with measured values when available.",
    "sources": [
      {
        "url": "https://doc.comsol.com/6.3/doc/com.comsol.help.models.heat.thermoelectric_leg/thermoelectric_leg.html",
        "properties": "Positive-Seebeck benchmark is the starting point; the negative Seebeck sign is an explicit modeling assumption."
      }
    ]
  },
  "Bismuth.json": {
    "format": "TE_2D_material",
    "version": 1,
    "referenceTemperature": 300,
    "units": {
      "rho": "kg/m^3",
      "Cp": "J/(kg K)",
      "k": "W/(m K)",
      "sigma": "S/m",
      "alpha": "V/K",
      "beta": "1/K",
      "alphaSlope": "V/K^2",
      "hall": "m^3/C",
      "nernst": "V/(K T)",
      "righiLeduc": "1/T",
      "magnetoresistance": "1/T^2"
    },
    "material": {
      "name": "Bismuth (polycrystalline)",
      "rho": 9780,
      "Cp": 122,
      "k": 7.97,
      "sigma": 625000.0,
      "alpha": -7e-05,
      "beta": 0,
      "alphaSlope": 0,
      "hall": -4.91e-07,
      "nernst": 6.4e-06,
      "righiLeduc": -0.307,
      "magnetoresistance": 0.094,
      "color": "#b07fd0"
    },
    "notes": "Polycrystalline bismuth near room temperature, a semimetal with electrons and holes and the largest Hall, Nernst and Righi-Leduc responses in this library. sigma, hall and nernst come from one polycrystalline sample (Porter et al. 2024): resistivity 0.16 mOhm cm and Hall carrier density 1.27e19 cm^-3 (n-type) at 50 C, Hall mobility 0.31 m^2/Vs, and a low-field Nernst coefficient of 6.4 uV/(K T) at 20 C fitted for |B| < 0.2 T. That paper reports -6.4 in the Gerlach convention; its single-band formula shows that convention has the opposite sign to this program's E_y = N*B*dT/dx, hence +6.4e-6 here. The handbook resistivity at 20 C is 1.29 uOhm m. alpha = -70 uV/K is typical of polycrystalline bismuth at 300 K (single crystals: about -50 uV/K perpendicular and -100 uV/K parallel to the trigonal axis). rho, Cp and k are handbook values. righiLeduc = sigma*hall, as measured for bismuth: its thermal Hall coefficient equals the Hall mobility (Kobayashi et al. 2012). magnetoresistance = mu_H^2 is an order-of-magnitude estimate for a compensated semimetal; measured values are large and depend on orientation and grain size. beta = 0 and alphaSlope = 0 (constant values). Validity: weak fields only, |B| up to about 0.2 T at 300 K. At higher fields the Nernst and Hall responses of bismuth become nonlinear, and the field also lowers the thermal conductivity (by about 16 % for heat perpendicular to the trigonal axis in a single crystal), which this constant-coefficient model does not include. Single crystals are strongly anisotropic, and the sign of their Nernst coefficient depends on the orientation of the field.",
    "sources": [
      {
        "url": "https://doi.org/10.1063/5.0222406",
        "properties": "Porter, Crawford and Toberer, Rev. Sci. Instrum. 95, 083903 (2024): polycrystalline Bi resistivity, Hall carrier density and mobility (50 C), low-field Nernst coefficient (20 C, Gerlach convention), and the single-band Nernst formula that fixes the convention."
      },
      {
        "url": "https://arxiv.org/pdf/1203.2237",
        "properties": "Kobayashi, Koizumi and Moritomo (2012): thermal Hall (Righi-Leduc) coefficient of bismuth, negative and equal to the Hall mobility sigma*R_H; thermal conductivity near 10-11 W/(m K) in a single crystal."
      },
      {
        "url": "https://arxiv.org/html/2501.17609",
        "properties": "Sola et al. (2025): orientation dependence and sign changes of the Nernst coefficient of Bi single crystals near room temperature; field-induced decrease of the thermal conductivity; resistivities 1.14 and 1.44 uOhm m perpendicular and parallel to the trigonal axis."
      },
      {
        "url": "https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12441624",
        "properties": "Seebeck coefficient of bismuth at 300 K: about -70 uV/K polycrystalline, -50 and -100 uV/K perpendicular and parallel to the trigonal axis."
      },
      {
        "url": "https://en.wikipedia.org/wiki/Bismuth",
        "properties": "Handbook values: density 9.78 g/cm^3, molar heat capacity 25.52 J/(mol K) (122 J/(kg K)), thermal conductivity 7.97 W/(m K), resistivity 1.29 uOhm m at 20 C."
      }
    ]
  },
  "Copper.json": {
    "format": "TE_2D_material",
    "version": 1,
    "referenceTemperature": 300,
    "units": {
      "rho": "kg/m^3",
      "Cp": "J/(kg K)",
      "k": "W/(m K)",
      "sigma": "S/m",
      "alpha": "V/K",
      "beta": "1/K",
      "alphaSlope": "V/K^2",
      "hall": "m^3/C",
      "nernst": "V/(K T)",
      "righiLeduc": "1/T",
      "magnetoresistance": "1/T^2"
    },
    "material": {
      "name": "Copper",
      "rho": 8960,
      "Cp": 385,
      "k": 401,
      "sigma": 57478566.4581124,
      "alpha": 1.83e-06,
      "beta": 0.004176967424511028,
      "alphaSlope": 0,
      "color": "#edaf6e",
      "hall": -5.17e-11,
      "nernst": 0,
      "righiLeduc": -0.002972,
      "magnetoresistance": 8.83e-06
    },
    "notes": "Approximate bulk room-temperature preset. Supplier resistivity at 293.15 K and tabulated temperature coefficient are treated as a local linear law and rebased to 300 K. Density, Cp and k are held constant. Seebeck is a representative constant from the cited thermopile table; alphaSlope=0 is an assumption. Not a wide-temperature or thin-film fit. Magnetic (3D): hall = -5.17e-11 m^3/C, the room-temperature low-field value (Hurd, via Yates et al.). righiLeduc = sigma*hall = -0.00297 1/T (Wiedemann-Franz law for the Hall components; electrons carry most of the heat). magnetoresistance = (sigma*hall)^2 = 8.8e-06 1/T^2, a Kohler-scale order-of-magnitude upper bound (zero for free electrons; the real value depends on the Fermi surface). nernst = 0: Mott-type estimates give |N| of order 1e-9 V/(K T) with a sign that is not established, negligible here.",
    "sources": [
      {
        "url": "https://www.goodfellow.com/global/copper-disc-group",
        "properties": "rho, Cp, k, resistivity and temperature coefficient; reference temperatures differ as documented above."
      },
      {
        "url": "https://patents.google.com/patent/US8696989B2/en",
        "properties": "Table 1: representative Seebeck coefficient."
      },
      {
        "url": "https://arxiv.org/pdf/cond-mat/0702554",
        "properties": "Table I: experimental low-field Hall coefficients at room temperature, Cu -5.17e-11 and Al -3.43e-11 m^3/C (compiled from C. M. Hurd, The Hall Effect in Metals and Alloys, 1972)."
      },
      {
        "url": "https://doi.org/10.1103/PhysRevLett.84.2219",
        "properties": "Zhang et al. (2000): the Wiedemann-Franz law holds for the Hall components in copper, the basis of the Righi-Leduc estimate S = sigma*R_H."
      }
    ]
  },
  "Ge_n_1e15.json": {
    "format": "TE_2D_material",
    "version": 1,
    "referenceTemperature": 300,
    "units": {
      "rho": "kg/m^3",
      "Cp": "J/(kg K)",
      "k": "W/(m K)",
      "sigma": "S/m",
      "alpha": "V/K",
      "beta": "1/K",
      "alphaSlope": "V/K^2",
      "hall": "m^3/C",
      "nernst": "V/(K T)",
      "righiLeduc": "1/T",
      "magnetoresistance": "1/T^2"
    },
    "material": {
      "name": "Ge n-type, 1e15 cm-3 (lightly doped)",
      "rho": 5323,
      "Cp": 310,
      "k": 58,
      "sigma": 62.175,
      "alpha": -0.000966,
      "beta": 0.00553,
      "alphaSlope": -4.31e-07,
      "hall": -0.006242,
      "nernst": 1.97e-05,
      "righiLeduc": -2.18e-06,
      "magnetoresistance": 0.0571,
      "color": "#9fc18e"
    },
    "notes": "Model preset: n-type Ge with 1e+15 donors/cm^3, fully ionized, at 300 K. rho, Cp and k are the Ioffe room-temperature values (k is for pure Ge; heavy doping lowers k by tens of percent, not included). Mobility 3881 cm^2/Vs from the Ioffe/Hilsum electron Hall mobility formula; sigma = n e mu. alpha from a single parabolic band with Fermi-Dirac statistics and an acoustic-phonon energy dependence (r = -1/2), reduced Fermi level -9.21; phonon drag is not included and adds roughly 10-30 % at this light doping. alphaSlope from the same model with Nc proportional to T^1.5. beta = 0.00553 1/K linearizes the lattice mobility law T^-1.66 at 300 K. Intrinsic conduction (ni = 2e13 cm^-3 at 300 K) becomes significant above roughly 370 K. Magnetic (3D): hall = -1/(n e) as before (Hall factor 1). nernst, magnetoresistance and righiLeduc are estimates from the single-parabolic-band Boltzmann model with Fermi-Dirac statistics and acoustic-phonon scattering (tau proportional to E^-1/2), the same model as alpha, at reduced Fermi level -9.21: Hall factor 1.18, Hall mobility 4572 cm^2/Vs; nernst = (kB/e)*mu_H*[<tau x>/<tau> - <tau^2 x>/<tau^2>] = 1.97e-05 V/(K T); magnetoresistance = 0.0571 1/T^2; righiLeduc = (kappa_e/kappa)*mu_H = -2.18e-06 1/T with kappa_e = L*sigma*T, L = 1.49e-08 W Ohm/K^2. Signs follow this program's convention E_y = N*B*dT/dx; the 'Gerlach' convention used in parts of the literature has the opposite sign. These are order-of-magnitude estimates: multiple anisotropic valleys and mixed scattering change them. Replace them with measured values when available.",
    "sources": [
      {
        "url": "https://www.ioffe.ru/SVA/NSM/Semicond/Ge/",
        "properties": "Ioffe NSM archive, Ge basic and thermal parameters at 300 K: density 5.3234 g/cm^3, specific heat 0.31 J/(g K), thermal conductivity 0.58 W/(cm K), Nc = 1.0e19 and Nv = 5.0e18 cm^-3."
      },
      {
        "url": "https://www.ioffe.ru/SVA/NSM/Semicond/Ge/electric.html",
        "properties": "Electron Hall mobility 3900/(1 + N*1e-17)^(1/2) cm^2/Vs (Hilsum 1974); lattice mobilities 4.9e7*T^-1.66 (electrons) and 1.05e9*T^-2.33 (holes) cm^2/Vs; limits 3900 and 1900 cm^2/Vs."
      }
    ]
  },
  "Ge_n_1e19.json": {
    "format": "TE_2D_material",
    "version": 1,
    "referenceTemperature": 300,
    "units": {
      "rho": "kg/m^3",
      "Cp": "J/(kg K)",
      "k": "W/(m K)",
      "sigma": "S/m",
      "alpha": "V/K",
      "beta": "1/K",
      "alphaSlope": "V/K^2",
      "hall": "m^3/C",
      "nernst": "V/(K T)",
      "righiLeduc": "1/T",
      "magnetoresistance": "1/T^2"
    },
    "material": {
      "name": "Ge n-type, 1e19 cm-3 (heavily doped)",
      "rho": 5323,
      "Cp": 310,
      "k": 58,
      "sigma": 62175.0,
      "alpha": -0.000184,
      "beta": 0,
      "alphaSlope": -3.77e-07,
      "hall": -6.242e-07,
      "nernst": 1.76e-06,
      "righiLeduc": -0.000231,
      "magnetoresistance": 0.000363,
      "color": "#6f9e5f"
    },
    "notes": "Model preset: n-type Ge with 1e+19 donors/cm^3, fully ionized, at 300 K. rho, Cp and k are the Ioffe room-temperature values (k is for pure Ge; heavy doping lowers k by tens of percent, not included). Mobility 388.1 cm^2/Vs from the Ioffe/Hilsum electron Hall mobility formula; sigma = n e mu. alpha from a single parabolic band with Fermi-Dirac statistics and an acoustic-phonon energy dependence (r = -1/2), reduced Fermi level 0.35; phonon drag is not included. alphaSlope from the same model with Nc proportional to T^1.5. beta = 0: the impurity-limited mobility changes little near 300 K. Magnetic (3D): hall = -1/(n e) as before (Hall factor 1). nernst, magnetoresistance and righiLeduc are estimates from the single-parabolic-band Boltzmann model with Fermi-Dirac statistics and acoustic-phonon scattering (tau proportional to E^-1/2), the same model as alpha, at reduced Fermi level 0.35: Hall factor 1.13, Hall mobility 437 cm^2/Vs; nernst = (kB/e)*mu_H*[<tau x>/<tau> - <tau^2 x>/<tau^2>] = 1.76e-06 V/(K T); magnetoresistance = 0.000363 1/T^2; righiLeduc = (kappa_e/kappa)*mu_H = -0.000231 1/T with kappa_e = L*sigma*T, L = 1.65e-08 W Ohm/K^2. Signs follow this program's convention E_y = N*B*dT/dx; the 'Gerlach' convention used in parts of the literature has the opposite sign. These are order-of-magnitude estimates: multiple anisotropic valleys and mixed scattering change them; at this doping ionized-impurity scattering limits the mobility and would make the Nernst coefficient smaller or negative, so its value mainly indicates the magnitude. Replace them with measured values when available.",
    "sources": [
      {
        "url": "https://www.ioffe.ru/SVA/NSM/Semicond/Ge/",
        "properties": "Ioffe NSM archive, Ge basic and thermal parameters at 300 K: density 5.3234 g/cm^3, specific heat 0.31 J/(g K), thermal conductivity 0.58 W/(cm K), Nc = 1.0e19 and Nv = 5.0e18 cm^-3."
      },
      {
        "url": "https://www.ioffe.ru/SVA/NSM/Semicond/Ge/electric.html",
        "properties": "Electron Hall mobility 3900/(1 + N*1e-17)^(1/2) cm^2/Vs (Hilsum 1974); lattice mobilities 4.9e7*T^-1.66 (electrons) and 1.05e9*T^-2.33 (holes) cm^2/Vs; limits 3900 and 1900 cm^2/Vs."
      }
    ]
  },
  "Ge_p_1e15.json": {
    "format": "TE_2D_material",
    "version": 1,
    "referenceTemperature": 300,
    "units": {
      "rho": "kg/m^3",
      "Cp": "J/(kg K)",
      "k": "W/(m K)",
      "sigma": "S/m",
      "alpha": "V/K",
      "beta": "1/K",
      "alphaSlope": "V/K^2",
      "hall": "m^3/C",
      "nernst": "V/(K T)",
      "righiLeduc": "1/T",
      "magnetoresistance": "1/T^2"
    },
    "material": {
      "name": "Ge p-type, 1e15 cm-3 (lightly doped)",
      "rho": 5323,
      "Cp": 310,
      "k": 58,
      "sigma": 28.458,
      "alpha": 0.0009063,
      "beta": 0.00777,
      "alphaSlope": 4.31e-07,
      "hall": 0.006242,
      "nernst": 9.01e-06,
      "righiLeduc": 4.57e-07,
      "magnetoresistance": 0.012,
      "color": "#c18ea9"
    },
    "notes": "Model preset: p-type Ge with 1e+15 acceptors/cm^3, fully ionized, at 300 K. rho, Cp and k are the Ioffe room-temperature values (k is for pure Ge; heavy doping lowers k by tens of percent, not included). Mobility 1776 cm^2/Vs from the Ioffe lattice formula 1.05e9*T^-2.33 at 300 K; sigma = n e mu. alpha from a single parabolic band with Fermi-Dirac statistics and an acoustic-phonon energy dependence (r = -1/2), reduced Fermi level -8.52; phonon drag is not included and adds roughly 10-30 % at this light doping. alphaSlope from the same model with Nc proportional to T^1.5. beta = 0.00777 1/K linearizes the lattice mobility law T^-2.33 at 300 K. Intrinsic conduction (ni = 2e13 cm^-3 at 300 K) becomes significant above roughly 370 K. Magnetic (3D): hall = +1/(n e) as before (Hall factor 1). nernst, magnetoresistance and righiLeduc are estimates from the single-parabolic-band Boltzmann model with Fermi-Dirac statistics and acoustic-phonon scattering (tau proportional to E^-1/2), the same model as alpha, at reduced Fermi level -8.52: Hall factor 1.18, Hall mobility 2093 cm^2/Vs; nernst = (kB/e)*mu_H*[<tau x>/<tau> - <tau^2 x>/<tau^2>] = 9.01e-06 V/(K T); magnetoresistance = 0.012 1/T^2; righiLeduc = (kappa_e/kappa)*mu_H = 4.57e-07 1/T with kappa_e = L*sigma*T, L = 1.49e-08 W Ohm/K^2. Signs follow this program's convention E_y = N*B*dT/dx; the 'Gerlach' convention used in parts of the literature has the opposite sign. These are order-of-magnitude estimates: multiple anisotropic valleys and mixed scattering change them. Replace them with measured values when available.",
    "sources": [
      {
        "url": "https://www.ioffe.ru/SVA/NSM/Semicond/Ge/",
        "properties": "Ioffe NSM archive, Ge basic and thermal parameters at 300 K: density 5.3234 g/cm^3, specific heat 0.31 J/(g K), thermal conductivity 0.58 W/(cm K), Nc = 1.0e19 and Nv = 5.0e18 cm^-3."
      },
      {
        "url": "https://www.ioffe.ru/SVA/NSM/Semicond/Ge/electric.html",
        "properties": "Electron Hall mobility 3900/(1 + N*1e-17)^(1/2) cm^2/Vs (Hilsum 1974); lattice mobilities 4.9e7*T^-1.66 (electrons) and 1.05e9*T^-2.33 (holes) cm^2/Vs; limits 3900 and 1900 cm^2/Vs."
      }
    ]
  },
  "Ge_p_1e19.json": {
    "format": "TE_2D_material",
    "version": 1,
    "referenceTemperature": 300,
    "units": {
      "rho": "kg/m^3",
      "Cp": "J/(kg K)",
      "k": "W/(m K)",
      "sigma": "S/m",
      "alpha": "V/K",
      "beta": "1/K",
      "alphaSlope": "V/K^2",
      "hall": "m^3/C",
      "nernst": "V/(K T)",
      "righiLeduc": "1/T",
      "magnetoresistance": "1/T^2"
    },
    "material": {
      "name": "Ge p-type, 1e19 cm-3 (heavily doped)",
      "rho": 5323,
      "Cp": 310,
      "k": 58,
      "sigma": 30290.0,
      "alpha": 0.0001345,
      "beta": 0,
      "alphaSlope": 3.35e-07,
      "hall": 6.242e-07,
      "nernst": 7.78e-07,
      "righiLeduc": 5.74e-05,
      "magnetoresistance": 6e-05,
      "color": "#9e5f7f"
    },
    "notes": "Model preset: p-type Ge with 1e+19 acceptors/cm^3, fully ionized, at 300 K. rho, Cp and k are the Ioffe room-temperature values (k is for pure Ge; heavy doping lowers k by tens of percent, not included). Mobility 189.1 cm^2/Vs from the Hilsum-type scaling 1900/(1 + N*1e-17)^(1/2), an assumption: the source gives this form for electrons only; sigma = n e mu. alpha from a single parabolic band with Fermi-Dirac statistics and an acoustic-phonon energy dependence (r = -1/2), reduced Fermi level 1.38; phonon drag is not included. alphaSlope from the same model with Nc proportional to T^1.5. beta = 0: the impurity-limited mobility changes little near 300 K. Magnetic (3D): hall = +1/(n e) as before (Hall factor 1). nernst, magnetoresistance and righiLeduc are estimates from the single-parabolic-band Boltzmann model with Fermi-Dirac statistics and acoustic-phonon scattering (tau proportional to E^-1/2), the same model as alpha, at reduced Fermi level 1.38: Hall factor 1.09, Hall mobility 207 cm^2/Vs; nernst = (kB/e)*mu_H*[<tau x>/<tau> - <tau^2 x>/<tau^2>] = 7.78e-07 V/(K T); magnetoresistance = 6e-05 1/T^2; righiLeduc = (kappa_e/kappa)*mu_H = 5.74e-05 1/T with kappa_e = L*sigma*T, L = 1.77e-08 W Ohm/K^2. Signs follow this program's convention E_y = N*B*dT/dx; the 'Gerlach' convention used in parts of the literature has the opposite sign. These are order-of-magnitude estimates: multiple anisotropic valleys and mixed scattering change them; at this doping ionized-impurity scattering limits the mobility and would make the Nernst coefficient smaller or negative, so its value mainly indicates the magnitude. Replace them with measured values when available.",
    "sources": [
      {
        "url": "https://www.ioffe.ru/SVA/NSM/Semicond/Ge/",
        "properties": "Ioffe NSM archive, Ge basic and thermal parameters at 300 K: density 5.3234 g/cm^3, specific heat 0.31 J/(g K), thermal conductivity 0.58 W/(cm K), Nc = 1.0e19 and Nv = 5.0e18 cm^-3."
      },
      {
        "url": "https://www.ioffe.ru/SVA/NSM/Semicond/Ge/electric.html",
        "properties": "Electron Hall mobility 3900/(1 + N*1e-17)^(1/2) cm^2/Vs (Hilsum 1974); lattice mobilities 4.9e7*T^-1.66 (electrons) and 1.05e9*T^-2.33 (holes) cm^2/Vs; limits 3900 and 1900 cm^2/Vs."
      }
    ]
  },
  "Gold.json": {
    "format": "TE_2D_material",
    "version": 1,
    "referenceTemperature": 300,
    "units": {
      "rho": "kg/m^3",
      "Cp": "J/(kg K)",
      "k": "W/(m K)",
      "sigma": "S/m",
      "alpha": "V/K",
      "beta": "1/K",
      "alphaSlope": "V/K^2",
      "hall": "m^3/C",
      "nernst": "V/(K T)",
      "righiLeduc": "1/T",
      "magnetoresistance": "1/T^2"
    },
    "material": {
      "name": "Gold",
      "rho": 19300,
      "Cp": 129,
      "k": 318,
      "sigma": 44242306.262940876,
      "alpha": 1.94e-06,
      "beta": 0.003893322951138797,
      "alphaSlope": 0,
      "color": "#e0b64d",
      "hall": -7.2e-11,
      "nernst": 0,
      "righiLeduc": -0.003185,
      "magnetoresistance": 1.01e-05
    },
    "notes": "Approximate bulk room-temperature preset. Supplier resistivity at 293.15 K and tabulated temperature coefficient are treated as a local linear law and rebased to 300 K. Density, Cp and k are held constant. Seebeck is a representative constant from the cited thermopile table; alphaSlope=0 is an assumption. Not a wide-temperature or thin-film fit. Magnetic (3D): hall = -7.2e-11 m^3/C, the room-temperature value tabulated by LibreTexts (after Ulaby and Omar). righiLeduc = sigma*hall = -0.00318 1/T (Wiedemann-Franz law for the Hall components; electrons carry most of the heat). magnetoresistance = (sigma*hall)^2 = 1e-05 1/T^2, a Kohler-scale order-of-magnitude upper bound (zero for free electrons; the real value depends on the Fermi surface). nernst = 0: Mott-type estimates give |N| of order 1e-9 V/(K T) with a sign that is not established, negligible here.",
    "sources": [
      {
        "url": "https://www.goodfellow.com/global/gold-pellets-group",
        "properties": "rho, Cp, k, resistivity and temperature coefficient; reference temperatures differ as documented above."
      },
      {
        "url": "https://patents.google.com/patent/US8696989B2/en",
        "properties": "Table 1: representative Seebeck coefficient."
      },
      {
        "url": "https://eng.libretexts.org/Bookshelves/Materials_Science/Supplemental_Modules_(Materials_Science)/Electronic_Properties/Hall_Effect",
        "properties": "Table 1: room-temperature Hall coefficient of gold, -0.72e-10 m^3/C (after Ulaby and Omar)."
      },
      {
        "url": "https://doi.org/10.1103/PhysRevLett.84.2219",
        "properties": "Zhang et al. (2000): the Wiedemann-Franz law holds for the Hall components in copper, the basis of the Righi-Leduc estimate S = sigma*R_H."
      }
    ]
  },
  "PbTe.json": {
    "format": "TE_2D_material",
    "version": 1,
    "referenceTemperature": 300,
    "units": {
      "rho": "kg/m^3",
      "Cp": "J/(kg K)",
      "k": "W/(m K)",
      "sigma": "S/m",
      "alpha": "V/K",
      "beta": "1/K",
      "alphaSlope": "V/K^2",
      "hall": "m^3/C",
      "nernst": "V/(K T)",
      "righiLeduc": "1/T",
      "magnetoresistance": "1/T^2"
    },
    "material": {
      "name": "PbTe (room-temperature model)",
      "rho": 8160,
      "Cp": 151,
      "k": 1.46,
      "sigma": 61000.0,
      "alpha": 0.000187,
      "beta": 0,
      "alphaSlope": 0,
      "color": "#db8bad",
      "hall": 6.242e-07,
      "nernst": 1.74e-06,
      "righiLeduc": 0.00883,
      "magnetoresistance": 0.000355
    },
    "notes": "Representative positive-Seebeck PbTe model from Bethke et al., Table 1 (mostly 293 K), held constant at nominal 300 K. beta=0 and alphaSlope=0 are assumptions. Doping, processing and temperature alter actual PbTe properties; this is not a high-temperature material fit. Magnetic (3D): hall = +1/(n e) as before (Hall factor 1). nernst, magnetoresistance and righiLeduc are estimates from the single-parabolic-band Boltzmann model with Fermi-Dirac statistics and acoustic-phonon scattering (tau proportional to E^-1/2), at reduced Fermi level 0.30 fitted to this file's Seebeck coefficient: Hall factor 1.13, Hall mobility 429 cm^2/Vs; nernst = (kB/e)*mu_H*[<tau x>/<tau> - <tau^2 x>/<tau^2>] = 1.74e-06 V/(K T); magnetoresistance = 0.000355 1/T^2; righiLeduc = (kappa_e/kappa)*mu_H = 0.00883 1/T with kappa_e = L*sigma*T, L = 1.64e-08 W Ohm/K^2. Signs follow this program's convention E_y = N*B*dT/dx; the 'Gerlach' convention used in parts of the literature has the opposite sign. These are order-of-magnitude estimates: multiple anisotropic valleys and mixed scattering change them. Replace them with measured values when available.",
    "sources": [
      {
        "url": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0151708",
        "properties": "Table 1: rho, Cp, k, sigma and Seebeck. Model at nominal 300 K approximates the tabulated near-room-temperature values."
      }
    ]
  },
  "Platinum.json": {
    "format": "TE_2D_material",
    "version": 1,
    "referenceTemperature": 300,
    "units": {
      "rho": "kg/m^3",
      "Cp": "J/(kg K)",
      "k": "W/(m K)",
      "sigma": "S/m",
      "alpha": "V/K",
      "beta": "1/K",
      "alphaSlope": "V/K^2",
      "hall": "m^3/C",
      "nernst": "V/(K T)",
      "righiLeduc": "1/T",
      "magnetoresistance": "1/T^2"
    },
    "material": {
      "name": "Platinum",
      "rho": 21450,
      "Cp": 133,
      "k": 71.6,
      "sigma": 9204633.034955211,
      "alpha": -5.28e-06,
      "beta": 0.0038174926863851844,
      "alphaSlope": 0,
      "color": "#b5bbce",
      "hall": -2.4e-11,
      "nernst": 0,
      "righiLeduc": -0.0002209,
      "magnetoresistance": 4.88e-08
    },
    "notes": "Approximate bulk room-temperature preset. Supplier resistivity at 293.15 K and tabulated temperature coefficient are treated as a local linear law and rebased to 300 K. Density, Cp and k are held constant. Seebeck is a representative constant from the cited thermopile table; alphaSlope=0 is an assumption. Not a wide-temperature or thin-film fit. Magnetic (3D): hall = -2.4e-11 m^3/C, an approximate value from Hall-coefficient compilations (e.g. Hurd, 1972) that could not be checked against a primary source: confirm before quantitative use. righiLeduc = sigma*hall = -0.000221 1/T (Wiedemann-Franz law for the Hall components; electrons carry most of the heat). magnetoresistance = (sigma*hall)^2 = 4.9e-08 1/T^2, a Kohler-scale order-of-magnitude upper bound (zero for free electrons; the real value depends on the Fermi surface). nernst = 0: Mott-type estimates give |N| of order 1e-9 V/(K T) with a sign that is not established, negligible here.",
    "sources": [
      {
        "url": "https://www.goodfellow.com/global/platinum-powder-group",
        "properties": "rho, Cp, k, resistivity and temperature coefficient; reference temperatures differ as documented above."
      },
      {
        "url": "https://patents.google.com/patent/US8696989B2/en",
        "properties": "Table 1: representative Seebeck coefficient."
      },
      {
        "url": "https://doi.org/10.1103/PhysRevLett.84.2219",
        "properties": "Zhang et al. (2000): the Wiedemann-Franz law holds for the Hall components in copper, the basis of the Righi-Leduc estimate S = sigma*R_H."
      }
    ]
  },
  "Si_n_1e15.json": {
    "format": "TE_2D_material",
    "version": 1,
    "referenceTemperature": 300,
    "units": {
      "rho": "kg/m^3",
      "Cp": "J/(kg K)",
      "k": "W/(m K)",
      "sigma": "S/m",
      "alpha": "V/K",
      "beta": "1/K",
      "alphaSlope": "V/K^2",
      "hall": "m^3/C",
      "nernst": "V/(K T)",
      "righiLeduc": "1/T",
      "magnetoresistance": "1/T^2"
    },
    "material": {
      "name": "Si n-type, 1e15 cm-3 (lightly doped)",
      "rho": 2329,
      "Cp": 700,
      "k": 130,
      "sigma": 21.55,
      "alpha": -0.001066,
      "beta": 0,
      "alphaSlope": -4.31e-07,
      "hall": -0.006242,
      "nernst": 6.83e-06,
      "righiLeduc": -1.17e-07,
      "magnetoresistance": 0.00686,
      "color": "#8ea9c1"
    },
    "notes": "Model preset: n-type Si with 1e+15 donors/cm^3, fully ionized, at 300 K. rho, Cp and k are the Ioffe room-temperature values (k is for pure Si; other sources give up to about 150 W/(m K); heavy doping lowers k by tens of percent, not included). Mobility 1345 cm^2/Vs from the Caughey-Thomas fit; sigma = n e mu. alpha from a single parabolic band with Fermi-Dirac statistics and an acoustic-phonon energy dependence (r = -1/2), reduced Fermi level -10.37; phonon drag is not included and adds roughly 10-30 % at this light doping. alphaSlope from the same model with Nc proportional to T^1.5. beta = 0: the lattice-limited mobility falls roughly as T^-2.4 for electrons and T^-2.2 for holes; for temperature-dependent runs enter beta of about 0.008 (n) or 0.0073 (p) 1/K. Magnetic (3D): hall = -1/(n e) as before (Hall factor 1). nernst, magnetoresistance and righiLeduc are estimates from the single-parabolic-band Boltzmann model with Fermi-Dirac statistics and acoustic-phonon scattering (tau proportional to E^-1/2), the same model as alpha, at reduced Fermi level -10.37: Hall factor 1.18, Hall mobility 1585 cm^2/Vs; nernst = (kB/e)*mu_H*[<tau x>/<tau> - <tau^2 x>/<tau^2>] = 6.83e-06 V/(K T); magnetoresistance = 0.00686 1/T^2; righiLeduc = (kappa_e/kappa)*mu_H = -1.17e-07 1/T with kappa_e = L*sigma*T, L = 1.49e-08 W Ohm/K^2. Signs follow this program's convention E_y = N*B*dT/dx; the 'Gerlach' convention used in parts of the literature has the opposite sign. These are order-of-magnitude estimates: multiple anisotropic valleys and mixed scattering change them. Replace them with measured values when available.",
    "sources": [
      {
        "url": "http://www.ioffe.ru/SVA/NSM/Semicond/Si/",
        "properties": "Ioffe NSM archive, Si basic and thermal parameters at 300 K: density 2.329 g/cm^3, specific heat 0.7 J/(g K), thermal conductivity 1.3 W/(cm K), effective densities of states Nc = 3.2e19 and Nv = 1.8e19 cm^-3."
      },
      {
        "url": "http://www.ioffe.ru/SVA/NSM/Semicond/Si/electric.html",
        "properties": "Lattice mobilities (electrons <= 1400, holes <= 450 cm^2/Vs), mobility versus doping and measured Hall factors versus doping at 300 K."
      },
      {
        "url": "https://doi.org/10.1109/PROC.1967.6123",
        "properties": "Caughey and Thomas (1967) mobility fit for Si at 300 K: electrons 92 + 1268/(1 + (N/1.3e17)^0.91), holes 47.7 + 447.3/(1 + (N/6.3e16)^0.76) cm^2/Vs."
      }
    ]
  },
  "Si_n_1e19.json": {
    "format": "TE_2D_material",
    "version": 1,
    "referenceTemperature": 300,
    "units": {
      "rho": "kg/m^3",
      "Cp": "J/(kg K)",
      "k": "W/(m K)",
      "sigma": "S/m",
      "alpha": "V/K",
      "beta": "1/K",
      "alphaSlope": "V/K^2",
      "hall": "m^3/C",
      "nernst": "V/(K T)",
      "righiLeduc": "1/T",
      "magnetoresistance": "1/T^2"
    },
    "material": {
      "name": "Si n-type, 1e19 cm-3 (heavily doped)",
      "rho": 2329,
      "Cp": 700,
      "k": 130,
      "sigma": 18570.0,
      "alpha": -0.0002764,
      "beta": 0,
      "alphaSlope": -4.12e-07,
      "hall": -6.242e-07,
      "nernst": 5.67e-07,
      "righiLeduc": -8.86e-06,
      "magnetoresistance": 4.36e-05,
      "color": "#5f7f9e"
    },
    "notes": "Model preset: n-type Si with 1e+19 donors/cm^3, fully ionized, at 300 K. rho, Cp and k are the Ioffe room-temperature values (k is for pure Si; other sources give up to about 150 W/(m K); heavy doping lowers k by tens of percent, not included). Mobility 115.9 cm^2/Vs from the Caughey-Thomas fit; sigma = n e mu. alpha from a single parabolic band with Fermi-Dirac statistics and an acoustic-phonon energy dependence (r = -1/2), reduced Fermi level -1.05; phonon drag is not included. alphaSlope from the same model with Nc proportional to T^1.5. beta = 0: the impurity-limited mobility changes little near 300 K. Magnetic (3D): hall = -1/(n e) as before (Hall factor 1). nernst, magnetoresistance and righiLeduc are estimates from the single-parabolic-band Boltzmann model with Fermi-Dirac statistics and acoustic-phonon scattering (tau proportional to E^-1/2), the same model as alpha, at reduced Fermi level -1.05: Hall factor 1.16, Hall mobility 134 cm^2/Vs; nernst = (kB/e)*mu_H*[<tau x>/<tau> - <tau^2 x>/<tau^2>] = 5.67e-07 V/(K T); magnetoresistance = 4.36e-05 1/T^2; righiLeduc = (kappa_e/kappa)*mu_H = -8.86e-06 1/T with kappa_e = L*sigma*T, L = 1.54e-08 W Ohm/K^2. Signs follow this program's convention E_y = N*B*dT/dx; the 'Gerlach' convention used in parts of the literature has the opposite sign. These are order-of-magnitude estimates: multiple anisotropic valleys and mixed scattering change them; at this doping ionized-impurity scattering limits the mobility and would make the Nernst coefficient smaller or negative, so its value mainly indicates the magnitude. Replace them with measured values when available.",
    "sources": [
      {
        "url": "http://www.ioffe.ru/SVA/NSM/Semicond/Si/",
        "properties": "Ioffe NSM archive, Si basic and thermal parameters at 300 K: density 2.329 g/cm^3, specific heat 0.7 J/(g K), thermal conductivity 1.3 W/(cm K), effective densities of states Nc = 3.2e19 and Nv = 1.8e19 cm^-3."
      },
      {
        "url": "http://www.ioffe.ru/SVA/NSM/Semicond/Si/electric.html",
        "properties": "Lattice mobilities (electrons <= 1400, holes <= 450 cm^2/Vs), mobility versus doping and measured Hall factors versus doping at 300 K."
      },
      {
        "url": "https://doi.org/10.1109/PROC.1967.6123",
        "properties": "Caughey and Thomas (1967) mobility fit for Si at 300 K: electrons 92 + 1268/(1 + (N/1.3e17)^0.91), holes 47.7 + 447.3/(1 + (N/6.3e16)^0.76) cm^2/Vs."
      }
    ]
  },
  "Si_p_1e15.json": {
    "format": "TE_2D_material",
    "version": 1,
    "referenceTemperature": 300,
    "units": {
      "rho": "kg/m^3",
      "Cp": "J/(kg K)",
      "k": "W/(m K)",
      "sigma": "S/m",
      "alpha": "V/K",
      "beta": "1/K",
      "alphaSlope": "V/K^2",
      "hall": "m^3/C",
      "nernst": "V/(K T)",
      "righiLeduc": "1/T",
      "magnetoresistance": "1/T^2"
    },
    "material": {
      "name": "Si p-type, 1e15 cm-3 (lightly doped)",
      "rho": 2329,
      "Cp": 700,
      "k": 130,
      "sigma": 7.6359,
      "alpha": 0.001017,
      "beta": 0,
      "alphaSlope": 4.31e-07,
      "hall": 0.006242,
      "nernst": 2.42e-06,
      "righiLeduc": 1.47e-08,
      "magnetoresistance": 0.000862,
      "color": "#c1a98e"
    },
    "notes": "Model preset: p-type Si with 1e+15 acceptors/cm^3, fully ionized, at 300 K. rho, Cp and k are the Ioffe room-temperature values (k is for pure Si; other sources give up to about 150 W/(m K); heavy doping lowers k by tens of percent, not included). Mobility 476.6 cm^2/Vs from the Caughey-Thomas fit; sigma = n e mu. alpha from a single parabolic band with Fermi-Dirac statistics and an acoustic-phonon energy dependence (r = -1/2), reduced Fermi level -9.80; phonon drag is not included and adds roughly 10-30 % at this light doping. alphaSlope from the same model with Nc proportional to T^1.5. beta = 0: the lattice-limited mobility falls roughly as T^-2.4 for electrons and T^-2.2 for holes; for temperature-dependent runs enter beta of about 0.008 (n) or 0.0073 (p) 1/K. Magnetic (3D): hall = +1/(n e) as before (Hall factor 1). nernst, magnetoresistance and righiLeduc are estimates from the single-parabolic-band Boltzmann model with Fermi-Dirac statistics and acoustic-phonon scattering (tau proportional to E^-1/2), the same model as alpha, at reduced Fermi level -9.80: Hall factor 1.18, Hall mobility 561 cm^2/Vs; nernst = (kB/e)*mu_H*[<tau x>/<tau> - <tau^2 x>/<tau^2>] = 2.42e-06 V/(K T); magnetoresistance = 0.000862 1/T^2; righiLeduc = (kappa_e/kappa)*mu_H = 1.47e-08 1/T with kappa_e = L*sigma*T, L = 1.49e-08 W Ohm/K^2. Signs follow this program's convention E_y = N*B*dT/dx; the 'Gerlach' convention used in parts of the literature has the opposite sign. These are order-of-magnitude estimates: multiple anisotropic valleys and mixed scattering change them. Replace them with measured values when available.",
    "sources": [
      {
        "url": "http://www.ioffe.ru/SVA/NSM/Semicond/Si/",
        "properties": "Ioffe NSM archive, Si basic and thermal parameters at 300 K: density 2.329 g/cm^3, specific heat 0.7 J/(g K), thermal conductivity 1.3 W/(cm K), effective densities of states Nc = 3.2e19 and Nv = 1.8e19 cm^-3."
      },
      {
        "url": "http://www.ioffe.ru/SVA/NSM/Semicond/Si/electric.html",
        "properties": "Lattice mobilities (electrons <= 1400, holes <= 450 cm^2/Vs), mobility versus doping and measured Hall factors versus doping at 300 K."
      },
      {
        "url": "https://doi.org/10.1109/PROC.1967.6123",
        "properties": "Caughey and Thomas (1967) mobility fit for Si at 300 K: electrons 92 + 1268/(1 + (N/1.3e17)^0.91), holes 47.7 + 447.3/(1 + (N/6.3e16)^0.76) cm^2/Vs."
      }
    ]
  },
  "Si_p_1e19.json": {
    "format": "TE_2D_material",
    "version": 1,
    "referenceTemperature": 300,
    "units": {
      "rho": "kg/m^3",
      "Cp": "J/(kg K)",
      "k": "W/(m K)",
      "sigma": "S/m",
      "alpha": "V/K",
      "beta": "1/K",
      "alphaSlope": "V/K^2",
      "hall": "m^3/C",
      "nernst": "V/(K T)",
      "righiLeduc": "1/T",
      "magnetoresistance": "1/T^2"
    },
    "material": {
      "name": "Si p-type, 1e19 cm-3 (heavily doped)",
      "rho": 2329,
      "Cp": 700,
      "k": 130,
      "sigma": 9134.1,
      "alpha": 0.0002297,
      "beta": 0,
      "alphaSlope": 3.99e-07,
      "hall": 6.242e-07,
      "nernst": 2.71e-07,
      "righiLeduc": 2.17e-06,
      "magnetoresistance": 9.44e-06,
      "color": "#9e7f5f"
    },
    "notes": "Model preset: p-type Si with 1e+19 acceptors/cm^3, fully ionized, at 300 K. rho, Cp and k are the Ioffe room-temperature values (k is for pure Si; other sources give up to about 150 W/(m K); heavy doping lowers k by tens of percent, not included). Mobility 57.01 cm^2/Vs from the Caughey-Thomas fit; sigma = n e mu. alpha from a single parabolic band with Fermi-Dirac statistics and an acoustic-phonon energy dependence (r = -1/2), reduced Fermi level -0.39; phonon drag is not included. alphaSlope from the same model with Nc proportional to T^1.5. beta = 0: the impurity-limited mobility changes little near 300 K. Magnetic (3D): hall = +1/(n e) as before (Hall factor 1). nernst, magnetoresistance and righiLeduc are estimates from the single-parabolic-band Boltzmann model with Fermi-Dirac statistics and acoustic-phonon scattering (tau proportional to E^-1/2), the same model as alpha, at reduced Fermi level -0.39: Hall factor 1.14, Hall mobility 65 cm^2/Vs; nernst = (kB/e)*mu_H*[<tau x>/<tau> - <tau^2 x>/<tau^2>] = 2.71e-07 V/(K T); magnetoresistance = 9.44e-06 1/T^2; righiLeduc = (kappa_e/kappa)*mu_H = 2.17e-06 1/T with kappa_e = L*sigma*T, L = 1.58e-08 W Ohm/K^2. Signs follow this program's convention E_y = N*B*dT/dx; the 'Gerlach' convention used in parts of the literature has the opposite sign. These are order-of-magnitude estimates: multiple anisotropic valleys and mixed scattering change them; at this doping ionized-impurity scattering limits the mobility and would make the Nernst coefficient smaller or negative, so its value mainly indicates the magnitude. Replace them with measured values when available.",
    "sources": [
      {
        "url": "http://www.ioffe.ru/SVA/NSM/Semicond/Si/",
        "properties": "Ioffe NSM archive, Si basic and thermal parameters at 300 K: density 2.329 g/cm^3, specific heat 0.7 J/(g K), thermal conductivity 1.3 W/(cm K), effective densities of states Nc = 3.2e19 and Nv = 1.8e19 cm^-3."
      },
      {
        "url": "http://www.ioffe.ru/SVA/NSM/Semicond/Si/electric.html",
        "properties": "Lattice mobilities (electrons <= 1400, holes <= 450 cm^2/Vs), mobility versus doping and measured Hall factors versus doping at 300 K."
      },
      {
        "url": "https://doi.org/10.1109/PROC.1967.6123",
        "properties": "Caughey and Thomas (1967) mobility fit for Si at 300 K: electrons 92 + 1268/(1 + (N/1.3e17)^0.91), holes 47.7 + 447.3/(1 + (N/6.3e16)^0.76) cm^2/Vs."
      }
    ]
  }
};
