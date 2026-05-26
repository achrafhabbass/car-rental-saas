<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AutoSphere — Tableau de bord</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    /* Core palette — warm, premium automotive */
    --ember: #E8542A;          /* signature ember orange */
    --ember-dark: #C73E16;
    --ember-glow: #FF8B5C;
    --navy: #161A2C;           /* deep premium navy */
    --navy-soft: #232843;
    --cream: #FBF6EE;          /* warm canvas */
    --cream-deep: #F5EDDF;
    --paper: #FFFEFB;
    --ink: #1A1D2E;
    --ink-soft: #4B5066;
    --ink-mute: #8B8FA3;
    --line: #E8DFCF;
    --line-soft: #F0E8D8;

    /* Accents */
    --emerald: #0F8A65;
    --emerald-soft: #D6F0E3;
    --amber: #D97706;
    --amber-soft: #FCE8C5;
    --rose: #C8345C;
    --rose-soft: #FBE0E6;
    --sky: #2563A8;
    --sky-soft: #D8E7F6;

    --r-sm: 10px;
    --r: 16px;
    --r-lg: 22px;
    --r-xl: 28px;

    --shadow-sm: 0 1px 2px rgba(22, 26, 44, 0.04), 0 1px 1px rgba(22, 26, 44, 0.03);
    --shadow: 0 4px 16px -4px rgba(22, 26, 44, 0.08), 0 2px 4px rgba(22, 26, 44, 0.04);
    --shadow-lg: 0 18px 40px -12px rgba(22, 26, 44, 0.14), 0 4px 12px rgba(22, 26, 44, 0.05);
    --shadow-ember: 0 18px 40px -14px rgba(232, 84, 42, 0.45), 0 4px 12px rgba(232, 84, 42, 0.15);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    background: var(--cream);
    color: var(--ink);
    -webkit-font-smoothing: antialiased;
    font-feature-settings: 'ss01', 'cv11';
  }

  body {
    min-height: 100vh;
    background:
      radial-gradient(circle at 15% 0%, rgba(232, 84, 42, 0.06), transparent 40%),
      radial-gradient(circle at 100% 100%, rgba(22, 26, 44, 0.04), transparent 50%),
      var(--cream);
  }

  .app {
    display: grid;
    grid-template-columns: 280px 1fr;
    min-height: 100vh;
  }

  /* ============ SIDEBAR ============ */
  .sidebar {
    background: var(--navy);
    padding: 28px 20px;
    position: relative;
    overflow: hidden;
  }

  .sidebar::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 0%, rgba(232, 84, 42, 0.18), transparent 50%),
      radial-gradient(circle at 80% 100%, rgba(255, 139, 92, 0.08), transparent 50%);
    pointer-events: none;
  }

  .brand {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px 10px 28px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    margin-bottom: 24px;
  }

  .brand-mark {
    width: 42px;
    height: 42px;
    background: linear-gradient(135deg, var(--ember) 0%, var(--ember-glow) 100%);
    border-radius: 12px;
    display: grid;
    place-items: center;
    box-shadow: 0 8px 20px -4px rgba(232, 84, 42, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3);
    position: relative;
  }
  .brand-mark svg { color: white; }

  .brand-text { color: white; }
  .brand-text h1 {
    font-family: 'Fraunces', serif;
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1;
    font-variation-settings: 'opsz' 144;
  }
  .brand-text span {
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.45);
    font-weight: 500;
  }

  .nav-section {
    position: relative;
    margin-bottom: 24px;
  }

  .nav-label {
    color: rgba(255, 255, 255, 0.4);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 0 12px 10px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.65);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    margin-bottom: 2px;
  }

  .nav-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }

  .nav-item.active {
    background: linear-gradient(135deg, rgba(232, 84, 42, 0.95), rgba(199, 62, 22, 0.85));
    color: white;
    box-shadow: 0 8px 18px -8px rgba(232, 84, 42, 0.7);
  }

  .nav-item.active::before {
    content: '';
    position: absolute;
    left: -20px;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 22px;
    background: var(--ember-glow);
    border-radius: 0 4px 4px 0;
  }

  .nav-item svg { flex-shrink: 0; }

  .nav-badge {
    margin-left: auto;
    background: var(--ember);
    color: white;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 8px;
    min-width: 18px;
    text-align: center;
  }

  .nav-item.active .nav-badge {
    background: rgba(255, 255, 255, 0.25);
  }

  /* ============ MAIN ============ */
  .main {
    padding: 0;
    overflow: hidden;
  }

  .topbar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px 36px;
    background: rgba(251, 246, 238, 0.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--line);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .search {
    flex: 1;
    max-width: 520px;
    position: relative;
  }

  .search input {
    width: 100%;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 12px 16px 12px 44px;
    font-family: inherit;
    font-size: 14px;
    color: var(--ink);
    transition: all 0.2s;
  }
  .search input:focus {
    outline: none;
    border-color: var(--ember);
    box-shadow: 0 0 0 4px rgba(232, 84, 42, 0.1);
  }
  .search input::placeholder { color: var(--ink-mute); }

  .search-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--ink-mute);
  }
  .search-kbd {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: var(--cream-deep);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 2px 6px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--ink-soft);
  }

  .top-actions { display: flex; align-items: center; gap: 10px; margin-left: auto; }

  .icon-btn {
    width: 42px; height: 42px;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 12px;
    display: grid; place-items: center;
    cursor: pointer;
    color: var(--ink-soft);
    transition: all 0.2s;
    position: relative;
  }
  .icon-btn:hover { border-color: var(--ember); color: var(--ember); }
  .icon-btn .dot {
    position: absolute;
    top: 10px; right: 11px;
    width: 8px; height: 8px;
    background: var(--ember);
    border-radius: 50%;
    border: 2px solid var(--paper);
  }

  .user-chip {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 14px 6px 6px;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 100px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .user-chip:hover { border-color: var(--ember); }

  .avatar {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--ember), var(--ember-glow));
    color: white;
    display: grid; place-items: center;
    font-weight: 700;
    font-size: 13px;
  }
  .user-chip-text { line-height: 1.2; }
  .user-chip-text strong { display: block; font-size: 13px; font-weight: 600; color: var(--ink); }
  .user-chip-text span { font-size: 10px; color: var(--ink-mute); font-weight: 600; letter-spacing: 0.08em; }

  /* ============ CONTENT ============ */
  .content {
    padding: 36px 36px 60px;
    max-width: 1600px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 32px;
    gap: 24px;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ember);
    margin-bottom: 12px;
  }
  .eyebrow::before {
    content: '';
    width: 24px; height: 1.5px;
    background: var(--ember);
  }

  .page-title {
    font-family: 'Fraunces', serif;
    font-size: 56px;
    font-weight: 500;
    letter-spacing: -0.035em;
    line-height: 0.95;
    color: var(--ink);
    font-variation-settings: 'opsz' 144;
  }
  .page-title em {
    font-style: italic;
    font-weight: 400;
    color: var(--ember);
  }

  .page-subtitle {
    color: var(--ink-soft);
    font-size: 15px;
    margin-top: 14px;
    max-width: 480px;
    line-height: 1.5;
  }

  .header-actions { display: flex; gap: 10px; }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 12px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    text-decoration: none;
  }
  .btn-primary {
    background: var(--navy);
    color: white;
    box-shadow: var(--shadow);
  }
  .btn-primary:hover {
    background: var(--ember);
    transform: translateY(-1px);
    box-shadow: var(--shadow-ember);
  }
  .btn-ghost {
    background: var(--paper);
    color: var(--ink);
    border: 1px solid var(--line);
  }
  .btn-ghost:hover { border-color: var(--ink); }

  /* ============ STATS GRID ============ */
  .stats {
    display: grid;
    grid-template-columns: 1.4fr 1fr 1fr 1fr;
    gap: 18px;
    margin-bottom: 28px;
  }

  .stat {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: var(--r-lg);
    padding: 24px;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  .stat:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .stat-hero {
    background: linear-gradient(135deg, var(--navy) 0%, var(--navy-soft) 100%);
    color: white;
    border-color: var(--navy);
  }
  .stat-hero::before {
    content: '';
    position: absolute;
    top: -40%;
    right: -20%;
    width: 320px;
    height: 320px;
    background: radial-gradient(circle, rgba(232, 84, 42, 0.5), transparent 70%);
    pointer-events: none;
  }
  .stat-hero::after {
    content: '';
    position: absolute;
    bottom: -50%;
    left: -10%;
    width: 240px;
    height: 240px;
    background: radial-gradient(circle, rgba(255, 139, 92, 0.2), transparent 70%);
    pointer-events: none;
  }

  .stat-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    position: relative;
  }

  .stat-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  .stat-hero .stat-label { color: rgba(255, 255, 255, 0.55); }

  .stat-icon {
    width: 38px; height: 38px;
    background: var(--cream-deep);
    border-radius: 10px;
    display: grid; place-items: center;
    color: var(--ink-soft);
  }
  .stat-hero .stat-icon {
    background: rgba(255, 255, 255, 0.1);
    color: var(--ember-glow);
    backdrop-filter: blur(10px);
  }
  .stat-icon.ember { background: rgba(232, 84, 42, 0.1); color: var(--ember); }
  .stat-icon.emerald { background: var(--emerald-soft); color: var(--emerald); }
  .stat-icon.rose { background: var(--rose-soft); color: var(--rose); }

  .stat-value {
    font-family: 'Fraunces', serif;
    font-size: 48px;
    font-weight: 500;
    letter-spacing: -0.04em;
    line-height: 1;
    color: var(--ink);
    font-variation-settings: 'opsz' 144;
    position: relative;
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  .stat-hero .stat-value { color: white; }
  .stat-value .unit {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: var(--ink-mute);
    letter-spacing: 0;
  }
  .stat-hero .stat-value .unit { color: rgba(255, 255, 255, 0.5); }

  .stat-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 14px;
    font-size: 13px;
    color: var(--ink-soft);
    position: relative;
  }
  .stat-hero .stat-meta { color: rgba(255, 255, 255, 0.6); }

  .trend {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 100px;
    font-size: 12px;
    font-weight: 600;
  }
  .trend-up { background: var(--emerald-soft); color: var(--emerald); }
  .trend-down { background: var(--rose-soft); color: var(--rose); }

  .stat-hero .trend-down {
    background: rgba(232, 84, 42, 0.2);
    color: var(--ember-glow);
  }

  .mini-bars {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 36px;
    margin-top: 18px;
  }
  .mini-bars div {
    flex: 1;
    background: var(--cream-deep);
    border-radius: 3px 3px 0 0;
    transition: all 0.3s;
  }
  .mini-bars div.active { background: var(--ember); }
  .stat-hero .mini-bars div { background: rgba(255, 255, 255, 0.1); }
  .stat-hero .mini-bars div.active { background: var(--ember-glow); }

  /* ============ GRID ============ */
  .grid-2 {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 18px;
    margin-bottom: 18px;
  }

  .card {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: var(--r-lg);
    padding: 28px;
    position: relative;
  }

  .card-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
  }

  .card-title-wrap h2 {
    font-family: 'Fraunces', serif;
    font-size: 24px;
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1.1;
    color: var(--ink);
    font-variation-settings: 'opsz' 144;
  }
  .card-title-wrap p {
    font-size: 13px;
    color: var(--ink-mute);
    margin-top: 4px;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 100px;
    font-size: 12px;
    font-weight: 600;
    background: var(--cream-deep);
    color: var(--ink-soft);
  }
  .pill .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--emerald); }

  /* Chart */
  .chart {
    position: relative;
    height: 240px;
  }
  .chart svg { width: 100%; height: 100%; overflow: visible; }

  .chart-legend {
    display: flex;
    gap: 20px;
    margin-bottom: 16px;
    font-size: 13px;
  }
  .legend-item { display: flex; align-items: center; gap: 8px; color: var(--ink-soft); }
  .legend-swatch { width: 12px; height: 12px; border-radius: 4px; }

  /* Alerts */
  .alert-item {
    display: flex;
    gap: 14px;
    padding: 16px;
    border-radius: var(--r);
    background: var(--cream);
    border: 1px solid var(--line-soft);
    margin-bottom: 10px;
    transition: all 0.2s;
    cursor: pointer;
  }
  .alert-item:hover {
    transform: translateX(2px);
    border-color: var(--line);
    box-shadow: var(--shadow-sm);
  }
  .alert-item:last-child { margin-bottom: 0; }

  .alert-icon {
    width: 40px; height: 40px;
    border-radius: 12px;
    background: var(--rose-soft);
    color: var(--rose);
    display: grid; place-items: center;
    flex-shrink: 0;
  }
  .alert-icon.amber { background: var(--amber-soft); color: var(--amber); }
  .alert-icon.sky { background: var(--sky-soft); color: var(--sky); }

  .alert-body { flex: 1; min-width: 0; }
  .alert-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 3px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .alert-tag {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--rose);
    color: white;
    letter-spacing: 0.05em;
  }
  .alert-tag.amber { background: var(--amber); }
  .alert-tag.sky { background: var(--sky); }
  .alert-desc {
    font-size: 13px;
    color: var(--ink-soft);
    line-height: 1.4;
  }
  .alert-time {
    font-size: 11px;
    color: var(--ink-mute);
    margin-top: 6px;
    font-family: 'JetBrains Mono', monospace;
  }

  /* Fleet card */
  .fleet-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }

  .vehicle-card {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: var(--r-lg);
    padding: 22px;
    transition: all 0.3s;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .vehicle-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
    border-color: var(--ember);
  }
  .vehicle-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--ember), var(--ember-glow));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s;
  }
  .vehicle-card:hover::before { transform: scaleX(1); }

  .vehicle-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .vehicle-status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 9px;
    border-radius: 100px;
    background: var(--emerald-soft);
    color: var(--emerald);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .vehicle-status .dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--emerald);
    animation: pulse 2s infinite;
  }
  .vehicle-status.rented { background: rgba(232, 84, 42, 0.1); color: var(--ember); }
  .vehicle-status.rented .dot { background: var(--ember); }
  .vehicle-status.maintenance { background: var(--amber-soft); color: var(--amber); }
  .vehicle-status.maintenance .dot { background: var(--amber); }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .vehicle-plate {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--ink-mute);
    font-weight: 500;
  }

  .vehicle-name {
    font-family: 'Fraunces', serif;
    font-size: 22px;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--ink);
    margin-bottom: 2px;
    font-variation-settings: 'opsz' 144;
  }
  .vehicle-model {
    font-size: 13px;
    color: var(--ink-soft);
    margin-bottom: 18px;
  }

  .vehicle-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px dashed var(--line);
  }
  .vehicle-stat-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--ink-mute);
    font-weight: 600;
    margin-bottom: 3px;
  }
  .vehicle-stat-value {
    font-size: 15px;
    font-weight: 600;
    color: var(--ink);
  }
  .vehicle-stat-value .price-unit {
    font-size: 11px;
    color: var(--ink-mute);
    font-weight: 500;
  }

  /* Section heading */
  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin: 36px 0 20px;
  }
  .section-head h2 {
    font-family: 'Fraunces', serif;
    font-size: 30px;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--ink);
    font-variation-settings: 'opsz' 144;
  }
  .section-head h2 em {
    font-style: italic;
    color: var(--ember);
    font-weight: 400;
  }
  .section-head .tabs {
    display: flex;
    gap: 6px;
    background: var(--paper);
    border: 1px solid var(--line);
    padding: 4px;
    border-radius: 12px;
  }
  .tab {
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    color: var(--ink-soft);
    transition: all 0.2s;
  }
  .tab.active {
    background: var(--navy);
    color: white;
  }

  /* Stagger animation */
  .fade-in {
    opacity: 0;
    animation: fadeIn 0.6s ease forwards;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .stat:nth-child(1) { animation-delay: 0.05s; }
  .stat:nth-child(2) { animation-delay: 0.1s; }
  .stat:nth-child(3) { animation-delay: 0.15s; }
  .stat:nth-child(4) { animation-delay: 0.2s; }
</style>
</head>
<body>
<div class="app">

  <!-- ============ SIDEBAR ============ -->
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-mark">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
      </div>
      <div class="brand-text">
        <h1>AutoSphere</h1>
        <span>Fleet Platform</span>
      </div>
    </div>

    <nav>
      <div class="nav-item active">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
        Tableau de bord
      </div>

      <div class="nav-section">
        <div class="nav-label">Opérations</div>
        <div class="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
          Véhicules
        </div>
        <div class="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/></svg>
          Clients
        </div>
        <div class="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Réservations
        </div>
        <div class="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Contrats
          <span class="nav-badge">2</span>
        </div>
        <div class="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/></svg>
          Calendrier
        </div>
      </div>

      <div class="nav-section">
        <div class="nav-label">Finance</div>
        <div class="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>
          Factures
        </div>
        <div class="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          Paiements
        </div>
        <div class="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>
          Crédits
        </div>
      </div>

      <div class="nav-section">
        <div class="nav-label">Support</div>
        <div class="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          Maintenance
        </div>
        <div class="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          Inspections
        </div>
        <div class="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          Alertes
          <span class="nav-badge">1</span>
        </div>
        <div class="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Rapports
        </div>
      </div>
    </nav>
  </aside>

  <!-- ============ MAIN ============ -->
  <main class="main">

    <!-- Topbar -->
    <div class="topbar">
      <div class="search">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Rechercher un véhicule, client, contrat...">
        <span class="search-kbd">⌘K</span>
      </div>
      <div class="top-actions">
        <div class="icon-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span class="dot"></span>
        </div>
        <div class="user-chip">
          <div class="avatar">AH</div>
          <div class="user-chip-text">
            <strong>Achraf Habbass</strong>
            <span>SUPER ADMIN</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--ink-mute);"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
    </div>

    <div class="content">

      <!-- Page header -->
      <div class="page-header">
        <div>
          <div class="eyebrow">Vue d'ensemble · 25 mai 2026</div>
          <h1 class="page-title">Bonjour, <em>Achraf</em></h1>
          <p class="page-subtitle">Votre flotte tourne à plein régime. Voici un aperçu de votre performance ce mois-ci.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-ghost">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exporter
          </button>
          <button class="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouvelle réservation
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats">
        <div class="stat stat-hero fade-in">
          <div class="stat-head">
            <div class="stat-label">Chiffre d'affaires · Mai</div>
            <div class="stat-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div class="stat-value">284 600 <span class="unit">MAD</span></div>
          <div class="stat-meta">
            <span class="trend trend-up" style="background: rgba(15, 138, 101, 0.25); color: #6EE7B7;">↗ +18.4%</span>
            <span>vs. avril · objectif 320k</span>
          </div>
          <div class="mini-bars">
            <div style="height: 40%"></div>
            <div style="height: 55%"></div>
            <div style="height: 35%"></div>
            <div style="height: 65%"></div>
            <div style="height: 50%"></div>
            <div style="height: 70%"></div>
            <div style="height: 60%"></div>
            <div style="height: 80%"></div>
            <div style="height: 72%"></div>
            <div style="height: 90%"></div>
            <div style="height: 85%"></div>
            <div class="active" style="height: 100%"></div>
          </div>
        </div>

        <div class="stat fade-in">
          <div class="stat-head">
            <div class="stat-label">Véhicules</div>
            <div class="stat-icon ember">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
            </div>
          </div>
          <div class="stat-value">14<span class="unit">/ 18</span></div>
          <div class="stat-meta">
            <span class="trend trend-up">78% occupation</span>
          </div>
        </div>

        <div class="stat fade-in">
          <div class="stat-head">
            <div class="stat-label">Contrats actifs</div>
            <div class="stat-icon emerald">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>
            </div>
          </div>
          <div class="stat-value">23</div>
          <div class="stat-meta">
            <span class="trend trend-up">↗ +4</span>
            <span>nouveaux ce mois</span>
          </div>
        </div>

        <div class="stat fade-in">
          <div class="stat-head">
            <div class="stat-label">Impayés</div>
            <div class="stat-icon rose">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
          </div>
          <div class="stat-value">3 250<span class="unit">MAD</span></div>
          <div class="stat-meta">
            <span class="trend trend-down">2 en retard</span>
          </div>
        </div>
      </div>

      <!-- Chart + Alerts -->
      <div class="grid-2">
        <div class="card">
          <div class="card-head">
            <div class="card-title-wrap">
              <h2>Recettes <em style="font-style: italic; color: var(--ember); font-family: 'Fraunces', serif; font-weight: 400;">&</em> Réservations</h2>
              <p>30 derniers jours · données en temps réel</p>
            </div>
            <span class="pill"><span class="dot"></span> En direct</span>
          </div>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-swatch" style="background: var(--ember);"></span>
              Recettes (MAD)
            </div>
            <div class="legend-item">
              <span class="legend-swatch" style="background: var(--navy);"></span>
              Réservations
            </div>
          </div>
          <div class="chart">
            <svg viewBox="0 0 800 240" preserveAspectRatio="none">
              <defs>
                <linearGradient id="emberGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#E8542A" stop-opacity="0.25"/>
                  <stop offset="100%" stop-color="#E8542A" stop-opacity="0"/>
                </linearGradient>
                <linearGradient id="navyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#161A2C" stop-opacity="0.12"/>
                  <stop offset="100%" stop-color="#161A2C" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <!-- Grid lines -->
              <line x1="0" y1="60" x2="800" y2="60" stroke="#E8DFCF" stroke-dasharray="3 4"/>
              <line x1="0" y1="120" x2="800" y2="120" stroke="#E8DFCF" stroke-dasharray="3 4"/>
              <line x1="0" y1="180" x2="800" y2="180" stroke="#E8DFCF" stroke-dasharray="3 4"/>

              <!-- Ember area -->
              <path d="M 0 180 L 50 170 L 100 150 L 150 160 L 200 130 L 250 140 L 300 110 L 350 100 L 400 120 L 450 80 L 500 95 L 550 70 L 600 85 L 650 50 L 700 60 L 750 40 L 800 55 L 800 240 L 0 240 Z"
                fill="url(#emberGrad)"/>
              <!-- Ember line -->
              <path d="M 0 180 L 50 170 L 100 150 L 150 160 L 200 130 L 250 140 L 300 110 L 350 100 L 400 120 L 450 80 L 500 95 L 550 70 L 600 85 L 650 50 L 700 60 L 750 40 L 800 55"
                fill="none" stroke="#E8542A" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>

              <!-- Navy line -->
              <path d="M 0 200 L 50 190 L 100 195 L 150 175 L 200 185 L 250 160 L 300 170 L 350 145 L 400 155 L 450 130 L 500 145 L 550 120 L 600 130 L 650 105 L 700 115 L 750 90 L 800 100"
                fill="none" stroke="#161A2C" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="0"/>

              <!-- Highlight dot -->
              <circle cx="750" cy="40" r="6" fill="white" stroke="#E8542A" stroke-width="3"/>
              <circle cx="750" cy="40" r="14" fill="#E8542A" fill-opacity="0.15"/>
            </svg>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div class="card-title-wrap">
              <h2>Alertes</h2>
              <p>À traiter en priorité</p>
            </div>
            <a href="#" style="color: var(--ember); font-size: 13px; font-weight: 600; text-decoration: none;">Tout voir →</a>
          </div>

          <div class="alert-item">
            <div class="alert-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div class="alert-body">
              <div class="alert-title">
                Entretien en retard
                <span class="alert-tag">CRITIQUE</span>
              </div>
              <div class="alert-desc">Vidange · Toyota Yaris (55678-N-3) — échéance dépassée</div>
              <div class="alert-time">14/04/2026 · il y a 41 jours</div>
            </div>
          </div>

          <div class="alert-item">
            <div class="alert-icon amber">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div class="alert-body">
              <div class="alert-title">
                Contrat expire bientôt
                <span class="alert-tag amber">URGENT</span>
              </div>
              <div class="alert-desc">Range Rover Evoque · OCP Mobility — fin dans 3 jours</div>
              <div class="alert-time">28/05/2026</div>
            </div>
          </div>

          <div class="alert-item">
            <div class="alert-icon sky">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <div class="alert-body">
              <div class="alert-title">
                Inspection programmée
                <span class="alert-tag sky">INFO</span>
              </div>
              <div class="alert-desc">3 véhicules à inspecter avant fin de semaine</div>
              <div class="alert-time">À planifier</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Fleet -->
      <div class="section-head">
        <h2>Flotte <em>en service</em></h2>
        <div class="tabs">
          <div class="tab active">Tous</div>
          <div class="tab">Loués</div>
          <div class="tab">Disponibles</div>
          <div class="tab">Maintenance</div>
        </div>
      </div>

      <div class="fleet-grid">
        <div class="vehicle-card">
          <div class="vehicle-head">
            <div>
              <div class="vehicle-name">Range Rover</div>
              <div class="vehicle-model">Evoque · 2023</div>
            </div>
            <div class="vehicle-status rented"><span class="dot"></span>Loué</div>
          </div>
          <div class="vehicle-plate">44567-M-1</div>
          <div class="vehicle-stats" style="margin-top: 16px;">
            <div>
              <div class="vehicle-stat-label">Tarif / jour</div>
              <div class="vehicle-stat-value">1 200 <span class="price-unit">MAD</span></div>
            </div>
            <div>
              <div class="vehicle-stat-label">Kilométrage</div>
              <div class="vehicle-stat-value">18 900 <span class="price-unit">km</span></div>
            </div>
          </div>
        </div>

        <div class="vehicle-card">
          <div class="vehicle-head">
            <div>
              <div class="vehicle-name">Mercedes</div>
              <div class="vehicle-model">Classe A · 2024</div>
            </div>
            <div class="vehicle-status rented"><span class="dot"></span>Loué</div>
          </div>
          <div class="vehicle-plate">22345-K-2</div>
          <div class="vehicle-stats" style="margin-top: 16px;">
            <div>
              <div class="vehicle-stat-label">Tarif / jour</div>
              <div class="vehicle-stat-value">850 <span class="price-unit">MAD</span></div>
            </div>
            <div>
              <div class="vehicle-stat-label">Kilométrage</div>
              <div class="vehicle-stat-value">4 100 <span class="price-unit">km</span></div>
            </div>
          </div>
        </div>

        <div class="vehicle-card">
          <div class="vehicle-head">
            <div>
              <div class="vehicle-name">Audi A3</div>
              <div class="vehicle-model">Sportback · 2024</div>
            </div>
            <div class="vehicle-status"><span class="dot"></span>Disponible</div>
          </div>
          <div class="vehicle-plate">33456-L-4</div>
          <div class="vehicle-stats" style="margin-top: 16px;">
            <div>
              <div class="vehicle-stat-label">Tarif / jour</div>
              <div class="vehicle-stat-value">900 <span class="price-unit">MAD</span></div>
            </div>
            <div>
              <div class="vehicle-stat-label">Kilométrage</div>
              <div class="vehicle-stat-value">3 800 <span class="price-unit">km</span></div>
            </div>
          </div>
        </div>

        <div class="vehicle-card">
          <div class="vehicle-head">
            <div>
              <div class="vehicle-name">Toyota Yaris</div>
              <div class="vehicle-model">Hybrid · 2023</div>
            </div>
            <div class="vehicle-status maintenance"><span class="dot"></span>Maintenance</div>
          </div>
          <div class="vehicle-plate">55678-N-3</div>
          <div class="vehicle-stats" style="margin-top: 16px;">
            <div>
              <div class="vehicle-stat-label">Tarif / jour</div>
              <div class="vehicle-stat-value">340 <span class="price-unit">MAD</span></div>
            </div>
            <div>
              <div class="vehicle-stat-label">Kilométrage</div>
              <div class="vehicle-stat-value">21 500 <span class="price-unit">km</span></div>
            </div>
          </div>
        </div>

        <div class="vehicle-card">
          <div class="vehicle-head">
            <div>
              <div class="vehicle-name">Volkswagen</div>
              <div class="vehicle-model">Golf · 2024</div>
            </div>
            <div class="vehicle-status"><span class="dot"></span>Disponible</div>
          </div>
          <div class="vehicle-plate">11234-J-3</div>
          <div class="vehicle-stats" style="margin-top: 16px;">
            <div>
              <div class="vehicle-stat-label">Tarif / jour</div>
              <div class="vehicle-stat-value">550 <span class="price-unit">MAD</span></div>
            </div>
            <div>
              <div class="vehicle-stat-label">Kilométrage</div>
              <div class="vehicle-stat-value">5 400 <span class="price-unit">km</span></div>
            </div>
          </div>
        </div>

        <div class="vehicle-card">
          <div class="vehicle-head">
            <div>
              <div class="vehicle-name">Hyundai Accent</div>
              <div class="vehicle-model">Berline · 2024</div>
            </div>
            <div class="vehicle-status rented"><span class="dot"></span>Loué</div>
          </div>
          <div class="vehicle-plate">67890-F-3</div>
          <div class="vehicle-stats" style="margin-top: 16px;">
            <div>
              <div class="vehicle-stat-label">Tarif / jour</div>
              <div class="vehicle-stat-value">400 <span class="price-unit">MAD</span></div>
            </div>
            <div>
              <div class="vehicle-stat-label">Kilométrage</div>
              <div class="vehicle-stat-value">6 200 <span class="price-unit">km</span></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </main>
</div>
</body>
</html>