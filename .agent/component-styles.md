# TransitHub Komponens Stílusok

> **Cél:** Részletes útmutató az egyes UI komponensek implementációjához.
> Minden komponens tartalmazza a HTML struktúrát és az SCSS stílusokat.

---

## 1. Header Komponens

### Light Mode Header
```html
<header class="header">
  <div class="header__container">
    <!-- Logo -->
    <div class="header__logo">
      <div class="header__logo-icon">
        <span class="material-symbols-outlined">directions_bus</span>
      </div>
      <span class="header__logo-text">TransitHub</span>
    </div>
    
    <!-- Navigation -->
    <nav class="header__nav">
      <a href="#" class="header__nav-link header__nav-link--active">Főoldal</a>
      <a href="#" class="header__nav-link">Menetrend</a>
      <a href="#" class="header__nav-link">Jegyek</a>
    </nav>
    
    <!-- Actions -->
    <div class="header__actions">
      <button class="header__btn-icon">
        <span class="material-symbols-outlined">notifications</span>
      </button>
      <div class="header__avatar"></div>
    </div>
  </div>
</header>
```

```scss
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  height: 4rem;
  border-bottom: 1px solid var(--border-light);
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  
  &__container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 1.5rem;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  &__logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    
    &-icon {
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
    }
    
    &-text {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      color: var(--text-main);
    }
  }
  
  &__nav {
    display: none;
    gap: 2rem;
    
    @media (min-width: 768px) {
      display: flex;
    }
    
    &-link {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
      transition: color 0.2s;
      
      &:hover, &--active {
        color: var(--primary);
      }
    }
  }
  
  &__actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  &__btn-icon {
    padding: 0.5rem;
    border-radius: 9999px;
    color: var(--text-secondary);
    transition: background-color 0.2s;
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }
  
  &__avatar {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 9999px;
    background-size: cover;
    background-position: center;
    border: 2px solid var(--border-light);
  }
}
```

---

## 2. Sidebar Komponens (Light Mode)

```html
<aside class="sidebar">
  <div class="sidebar__header">
    <div class="sidebar__logo">
      <span class="material-symbols-outlined">directions_bus</span>
    </div>
    <span class="sidebar__title">TransitHub</span>
  </div>
  
  <nav class="sidebar__nav">
    <a href="#" class="sidebar__link sidebar__link--active">
      <span class="material-symbols-outlined">dashboard</span>
      <span>Dashboard</span>
    </a>
    <a href="#" class="sidebar__link">
      <span class="material-symbols-outlined">history</span>
      <span>Előzmények</span>
    </a>
    <a href="#" class="sidebar__link">
      <span class="material-symbols-outlined">confirmation_number</span>
      <span>Jegyeim</span>
    </a>
    <a href="#" class="sidebar__link">
      <span class="material-symbols-outlined">map</span>
      <span>Térkép</span>
    </a>
  </nav>
  
  <div class="sidebar__footer">
    <a href="#" class="sidebar__link">
      <span class="material-symbols-outlined">help</span>
      <span>Segítség</span>
    </a>
    <div class="sidebar__user">
      <div class="sidebar__avatar"></div>
      <div class="sidebar__user-info">
        <span class="sidebar__user-name">Anna K.</span>
        <span class="sidebar__user-role">Premium tag</span>
      </div>
    </div>
  </div>
</aside>
```

```scss
.sidebar {
  width: 240px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--surface-light);
  border-right: 1px solid var(--border-light);
  padding: 1.5rem 1rem;
  
  &__header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.75rem;
    margin-bottom: 2rem;
  }
  
  &__logo {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--primary);
    color: white;
    border-radius: 0.5rem;
  }
  
  &__title {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--text-main);
  }
  
  &__nav {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }
  
  &__link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    transition: all 0.2s;
    
    .material-symbols-outlined {
      font-size: 1.25rem;
    }
    
    &:hover {
      background-color: rgba(0, 168, 135, 0.05);
      color: var(--primary);
    }
    
    &--active {
      background-color: var(--primary);
      color: white;
      
      &:hover {
        background-color: var(--primary-dark);
        color: white;
      }
    }
  }
  
  &__footer {
    margin-top: auto;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-light);
  }
  
  &__user {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    margin-top: 1rem;
  }
  
  &__avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 9999px;
    background-size: cover;
    background-position: center;
  }
  
  &__user-info {
    display: flex;
    flex-direction: column;
  }
  
  &__user-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-main);
  }
  
  &__user-role {
    font-size: 0.75rem;
    color: var(--primary);
  }
}
```

---

## 3. Dashboard Kártya (Widget)

### Light Mode
```html
<div class="widget">
  <div class="widget__header">
    <div class="widget__icon">
      <span class="material-symbols-outlined">map</span>
    </div>
    <div class="widget__title-group">
      <h3 class="widget__title">Hova utazol?</h3>
      <p class="widget__subtitle">Tervezd meg az útvonaladat</p>
    </div>
  </div>
  <div class="widget__content">
    <!-- Content here -->
  </div>
  <div class="widget__footer">
    <button class="btn btn--primary btn--full">
      Tervezés
      <span class="material-symbols-outlined">arrow_forward</span>
    </button>
  </div>
</div>
```

```scss
.widget {
  background-color: var(--surface-light);
  border-radius: 1rem;
  border: 1px solid var(--border-light);
  padding: 1.5rem;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  
  &:hover {
    box-shadow: 0 10px 25px -5px rgba(0, 168, 135, 0.1);
  }
  
  &__header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  &__icon {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 168, 135, 0.1);
    color: var(--primary);
    border-radius: 0.625rem;
    flex-shrink: 0;
    
    .material-symbols-outlined {
      font-size: 1.25rem;
    }
  }
  
  &__title-group {
    flex: 1;
  }
  
  &__title {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--text-main);
    line-height: 1.3;
  }
  
  &__subtitle {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }
  
  &__content {
    margin-bottom: 1.5rem;
  }
  
  &__footer {
    margin-top: auto;
  }
}
```

### Dark Mode Widget
```scss
.widget--dark {
  background-color: #18302b;
  border-color: #273a36;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2);
  
  .widget__title {
    color: white;
  }
  
  .widget__subtitle {
    color: #9abcb5;
  }
  
  .widget__icon {
    background-color: #0f231f;
    border: 1px solid #273a36;
  }
}
```

---

## 4. Route Result Item

```html
<div class="route-result">
  <div class="route-result__time">
    <span class="route-result__departure">14:00</span>
    <span class="route-result__arrival">14:45</span>
    <span class="route-result__status route-result__status--on-time">Pontos indulás</span>
  </div>
  
  <div class="route-result__duration">
    <span class="route-result__duration-value">45 perc</span>
    <span class="route-result__zone">1. zóna</span>
  </div>
  
  <div class="route-result__modes">
    <span class="route-result__mode route-result__mode--bus">7E</span>
    <span class="route-result__transfer">→</span>
    <span class="route-result__mode route-result__mode--metro">M4</span>
  </div>
</div>
```

```scss
.route-result {
  display: flex;
  align-items: center;
  padding: 1rem 1.25rem;
  background-color: var(--surface-light);
  border: 1px solid var(--border-light);
  border-radius: 0.75rem;
  transition: all 0.2s;
  cursor: pointer;
  
  &:hover {
    border-color: var(--primary);
    box-shadow: 0 4px 12px rgba(0, 168, 135, 0.1);
  }
  
  &--selected {
    border-color: var(--primary);
    background-color: rgba(0, 168, 135, 0.05);
  }
  
  &__time {
    display: flex;
    flex-direction: column;
    min-width: 80px;
  }
  
  &__departure {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--text-main);
  }
  
  &__arrival {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  
  &__status {
    font-size: 0.75rem;
    font-weight: 600;
    margin-top: 0.25rem;
    
    &--on-time {
      color: var(--primary);
    }
    
    &--delayed {
      color: #f59e0b;
    }
  }
  
  &__duration {
    margin-left: auto;
    text-align: right;
    
    &-value {
      font-size: 1rem;
      font-weight: 600;
      color: var(--primary);
    }
  }
  
  &__zone {
    display: block;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
  
  &__modes {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: 1.5rem;
  }
  
  &__mode {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 1.5rem;
    padding: 0 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: white;
    
    &--bus {
      background-color: var(--primary);
    }
    
    &--metro {
      background-color: #3b82f6;
    }
    
    &--tram {
      background-color: #f59e0b;
    }
    
    &--train {
      background-color: #8b5cf6;
    }
  }
  
  &__transfer {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
}
```

---

## 5. Ticket/Pass Card

```html
<div class="ticket-card">
  <div class="ticket-card__header">
    <div class="ticket-card__brand">
      <span class="ticket-card__brand-icon material-symbols-outlined">directions_subway</span>
      <span class="ticket-card__brand-name">Metro Pass</span>
    </div>
    <span class="ticket-card__type">Zone 1-2 • Day Traveller</span>
  </div>
  
  <div class="ticket-card__validity">
    <div class="ticket-card__time-block">
      <span class="ticket-card__label">Érvényes:</span>
      <span class="ticket-card__value">10:00</span>
      <span class="ticket-card__date">Ma</span>
    </div>
    <span class="material-symbols-outlined ticket-card__arrow">arrow_forward</span>
    <div class="ticket-card__time-block ticket-card__time-block--end">
      <span class="ticket-card__label">Lejár:</span>
      <span class="ticket-card__value">10:00</span>
      <span class="ticket-card__date">Holnap</span>
    </div>
  </div>
  
  <div class="ticket-card__perforation">
    <div class="ticket-card__hole ticket-card__hole--left"></div>
    <div class="ticket-card__dashed-line"></div>
    <div class="ticket-card__hole ticket-card__hole--right"></div>
  </div>
  
  <div class="ticket-card__qr-section">
    <div class="ticket-card__qr">
      <img src="qr-code.png" alt="QR Code">
    </div>
    <div class="ticket-card__status">
      <span class="ticket-card__status-dot"></span>
      Aktív előnézet
    </div>
    <p class="ticket-card__instruction">
      Mutasd be ezt a kódot a forgókapunál a belépéshez.
    </p>
  </div>
  
  <div class="ticket-card__footer">
    <span>Jegy #8392-AX</span>
    <span>Ref: PREVIEW</span>
  </div>
</div>
```

```scss
.ticket-card {
  position: relative;
  background-color: var(--surface-light);
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid var(--border-light);
  
  &__header {
    background-color: var(--primary);
    padding: 1.5rem;
    color: white;
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(white 2px, transparent 2px);
      background-size: 20px 20px;
      opacity: 0.1;
    }
  }
  
  &__brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
    z-index: 1;
    
    &-icon {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 9999px;
      backdrop-filter: blur(4px);
    }
    
    &-name {
      font-size: 1.25rem;
      font-weight: 700;
    }
  }
  
  &__type {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
    position: relative;
    z-index: 1;
  }
  
  &__validity {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    background-color: var(--primary);
    color: white;
    position: relative;
    z-index: 1;
  }
  
  &__time-block {
    display: flex;
    flex-direction: column;
    
    &--end {
      text-align: right;
    }
  }
  
  &__label {
    font-size: 0.625rem;
    text-transform: uppercase;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
  }
  
  &__value {
    font-size: 1.125rem;
    font-weight: 700;
  }
  
  &__date {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
  }
  
  &__arrow {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &__perforation {
    position: relative;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--surface-light);
    margin-top: -1rem;
  }
  
  &__hole {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 1.5rem;
    height: 2rem;
    background-color: var(--background-light);
    
    &--left {
      left: 0;
      border-radius: 0 9999px 9999px 0;
    }
    
    &--right {
      right: 0;
      border-radius: 9999px 0 0 9999px;
    }
  }
  
  &__dashed-line {
    width: 80%;
    border-bottom: 2px dashed var(--border-light);
  }
  
  &__qr-section {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  &__qr {
    background-color: white;
    padding: 0.75rem;
    border-radius: 0.75rem;
    border: 1px solid var(--border-light);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    
    img {
      width: 10rem;
      height: 10rem;
    }
  }
  
  &__status {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.75rem;
    background-color: rgba(16, 185, 129, 0.1);
    color: #10b981;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-radius: 9999px;
    
    &-dot {
      width: 0.5rem;
      height: 0.5rem;
      background-color: #10b981;
      border-radius: 9999px;
      animation: pulse 2s ease-in-out infinite;
    }
  }
  
  &__instruction {
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-align: center;
    max-width: 200px;
    line-height: 1.5;
  }
  
  &__footer {
    display: flex;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-light);
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
}
```

---

## 6. Form Elemek

### Input Group
```html
<div class="form-group">
  <label class="form-label" for="email">Email cím</label>
  <div class="form-input-wrapper">
    <span class="form-input-icon material-symbols-outlined">mail</span>
    <input type="email" id="email" class="form-input" placeholder="pelda@email.com">
  </div>
</div>
```

```scss
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-main);
}

.form-input-wrapper {
  position: relative;
}

.form-input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 1.25rem;
  pointer-events: none;
}

.form-input {
  width: 100%;
  height: 3.5rem;
  padding: 0 1rem;
  padding-left: 2.75rem; // ha van ikon
  background-color: var(--surface-light);
  border: 1px solid var(--border-light);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  color: var(--text-main);
  transition: all 0.2s;
  
  &::placeholder {
    color: var(--text-secondary);
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(0, 168, 135, 0.1);
  }
  
  &--error {
    border-color: #ef4444;
    
    &:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
  }
}
```

---

## 7. Rating Card

```html
<div class="rating-card">
  <div class="rating-card__icon">
    <span class="material-symbols-outlined">directions_bus</span>
  </div>
  <div class="rating-card__content">
    <h4 class="rating-card__title">501 Queen</h4>
    <p class="rating-card__subtitle">STREETCAR</p>
    <div class="rating-card__stars">
      <span class="material-symbols-outlined rating-card__star rating-card__star--filled">star</span>
      <span class="material-symbols-outlined rating-card__star rating-card__star--filled">star</span>
      <span class="material-symbols-outlined rating-card__star rating-card__star--filled">star</span>
      <span class="material-symbols-outlined rating-card__star rating-card__star--filled">star</span>
      <span class="material-symbols-outlined rating-card__star">star</span>
      <span class="rating-card__value">4.0</span>
    </div>
    <p class="rating-card__description">
      Always on time, but crowded during rush hour. The new cars are much cleaner though.
    </p>
    <span class="rating-card__date">Oct 12, 2023</span>
  </div>
</div>
```

```scss
.rating-card {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background-color: var(--surface-light);
  border: 1px solid var(--border-light);
  border-radius: 0.75rem;
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  
  &__icon {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 168, 135, 0.1);
    color: var(--primary);
    border-radius: 0.5rem;
    flex-shrink: 0;
  }
  
  &__content {
    flex: 1;
  }
  
  &__title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-main);
  }
  
  &__subtitle {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }
  
  &__stars {
    display: flex;
    align-items: center;
    gap: 0.125rem;
    margin-bottom: 0.5rem;
  }
  
  &__star {
    font-size: 1rem;
    color: #d1d5db;
    
    &--filled {
      color: #f59e0b;
    }
  }
  
  &__value {
    margin-left: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-main);
  }
  
  &__description {
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin-bottom: 0.5rem;
  }
  
  &__date {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
}
```

---

## 8. Stats Card (Admin)

```html
<div class="stat-card">
  <div class="stat-card__header">
    <span class="material-symbols-outlined stat-card__icon">group</span>
    <div class="stat-card__trend stat-card__trend--up">
      <span class="material-symbols-outlined">trending_up</span>
      +12%
    </div>
  </div>
  <p class="stat-card__label">Total Users</p>
  <p class="stat-card__value">24.5k</p>
</div>
```

```scss
.stat-card {
  padding: 1.25rem;
  background-color: var(--surface-light);
  border: 1px solid var(--border-light);
  border-radius: 0.75rem;
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }
  
  &__icon {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 168, 135, 0.1);
    color: var(--primary);
    border-radius: 0.5rem;
  }
  
  &__trend {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    
    .material-symbols-outlined {
      font-size: 0.875rem;
    }
    
    &--up {
      color: #10b981;
    }
    
    &--down {
      color: #ef4444;
    }
  }
  
  &__label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
  }
  
  &__value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-main);
  }
}
```

---

## 9. Tab Navigation

```html
<div class="tabs">
  <button class="tabs__item tabs__item--active">
    <span class="material-symbols-outlined">list</span>
    All
  </button>
  <button class="tabs__item">
    <span class="material-symbols-outlined">directions_bus</span>
    Routes
  </button>
  <button class="tabs__item">
    <span class="material-symbols-outlined">place</span>
    Stops
  </button>
</div>
```

```scss
.tabs {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 0.5rem;
  
  &__item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    border-radius: 0.375rem;
    transition: all 0.2s;
    
    .material-symbols-outlined {
      font-size: 1.125rem;
    }
    
    &:hover {
      color: var(--text-main);
    }
    
    &--active {
      background-color: white;
      color: var(--text-main);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  }
}
```

---

## 10. Report List Item

```html
<div class="report-item">
  <div class="report-item__icon report-item__icon--vandalism">
    <span class="material-symbols-outlined">warning</span>
  </div>
  <div class="report-item__content">
    <div class="report-item__category">Vandalism</div>
    <h4 class="report-item__title">Graffiti on Platform 4</h4>
    <p class="report-item__description">
      Large spray paint markings on the north wall near the exit signs.
    </p>
  </div>
  <div class="report-item__status">
    <span class="report-item__badge report-item__badge--submitted">Submitted</span>
    <a href="#" class="report-item__link">View Details →</a>
  </div>
</div>
```

```scss
.report-item {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background-color: var(--surface-light);
  border: 1px solid var(--border-light);
  border-radius: 0.75rem;
  
  &__icon {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    flex-shrink: 0;
    
    &--vandalism {
      background-color: rgba(99, 102, 241, 0.1);
      color: #6366f1;
    }
    
    &--maintenance {
      background-color: rgba(249, 115, 22, 0.1);
      color: #f97316;
    }
    
    &--safety {
      background-color: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }
    
    &--cleanliness {
      background-color: rgba(236, 72, 153, 0.1);
      color: #ec4899;
    }
  }
  
  &__content {
    flex: 1;
  }
  
  &__category {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6366f1;
    margin-bottom: 0.25rem;
  }
  
  &__title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-main);
    margin-bottom: 0.25rem;
  }
  
  &__description {
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }
  
  &__status {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
  }
  
  &__badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.625rem;
    border-radius: 9999px;
    
    &--submitted {
      background-color: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }
    
    &--under-review {
      background-color: rgba(249, 115, 22, 0.1);
      color: #f97316;
    }
    
    &--resolved {
      background-color: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }
  }
  
  &__link {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--primary);
    
    &:hover {
      text-decoration: underline;
    }
  }
}
```
