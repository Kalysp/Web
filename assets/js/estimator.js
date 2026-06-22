/**
 * Kaly's Pizzeria — Pricing Estimator + Form Logic
 *
 * Tier logic:
 *  20–40 pizzas → low rate (per brief)
 *  41–70 pizzas → high rate (lower price per pizza)
 *  71–100       → custom quote (discuss on call)
 *  < 20         → validation error (minimum not met)
 *  > 100        → contact directly
 */

const RATES = {
  margherita: { low: 650,  high: 625  },
  classic:    { low: 750,  high: 725  },
  signature:  { low: 950,  high: 925  }
};

const SERVICE_TIMES = {
  tier1: 'Up to 2 hours',
  tier2: 'Up to 3 hours',
  custom: 'Discussed on call'
};

function formatINR(amount) {
  return '₹' + amount.toLocaleString('en-IN');
}

function updateEstimate() {
  const packageEl = document.getElementById('pizzaPackage');
  const countEl   = document.getElementById('pizzaCount');
  const resultEl  = document.getElementById('estimatorResult');
  const amountEl  = document.getElementById('estimatorAmount');
  const descEl    = document.getElementById('estimatorDesc');

  if (!packageEl || !countEl || !resultEl) return;

  const pkg   = packageEl.value;
  const count = parseInt(countEl.value, 10);

  // Clear state
  resultEl.classList.remove('visible', 'custom', 'error');
  resultEl.style.borderColor = '';
  resultEl.style.background = '';

  // Need both fields
  if (!pkg || !count || isNaN(count)) return;

  const rates = RATES[pkg];

  if (count < 20) {
    // Below minimum
    resultEl.classList.add('visible', 'error');
    resultEl.style.borderColor = '#e53935';
    resultEl.style.background  = '#fde8e8';
    amountEl.textContent       = 'Minimum not met';
    amountEl.style.fontSize    = '1.25rem';
    amountEl.style.color       = '#c62828';
    descEl.textContent         = 'Our minimum booking is 20 pizzas. Please increase your order.';
    descEl.style.color         = '#c62828';
    setHiddenField('estimateStatus',     'below_minimum');
    setHiddenField('estimatedUnitRate',  '');
    setHiddenField('estimatedTotal',     '');
    setHiddenField('includedServiceTime','');
    return;
  }

  if (count > 100) {
    // Above 100 — direct contact
    resultEl.classList.add('visible', 'custom');
    amountEl.textContent    = 'Please contact us directly';
    amountEl.style.fontSize = '1.25rem';
    amountEl.style.color    = 'var(--terracotta-dark)';
    descEl.textContent      = 'For events above 100 pizzas, please reach out to us directly so we can discuss setup, team size, and pricing.';
    descEl.style.color      = '';
    setHiddenField('estimateStatus',     'above_100');
    setHiddenField('estimatedUnitRate',  '');
    setHiddenField('estimatedTotal',     '');
    setHiddenField('includedServiceTime','');
    return;
  }

  if (count >= 71) {
    // 71–100: custom quote
    resultEl.classList.add('visible', 'custom');
    amountEl.textContent    = 'Pricing discussed on call';
    amountEl.style.fontSize = '1.5rem';
    amountEl.style.color    = 'var(--terracotta-dark)';
    descEl.textContent      = 'For ' + count + ' pizzas, we'll discuss pricing, setup, and timing on a call. Fill in the form and we'll get back to you.';
    descEl.style.color      = '';
    setHiddenField('estimateStatus',     'custom_quote');
    setHiddenField('estimatedUnitRate',  '');
    setHiddenField('estimatedTotal',     '');
    setHiddenField('includedServiceTime', SERVICE_TIMES.custom);
    return;
  }

  // Tier 1: 20–40
  // Tier 2: 41–70
  let rate, serviceTime, tierLabel;
  if (count <= 40) {
    rate        = rates.low;
    serviceTime = SERVICE_TIMES.tier1;
    tierLabel   = '20–40 pizza rate';
  } else {
    rate        = rates.high;
    serviceTime = SERVICE_TIMES.tier2;
    tierLabel   = '41–70 pizza rate';
  }

  const total = count * rate;

  resultEl.classList.add('visible');
  resultEl.style.borderColor = '';
  resultEl.style.background  = '';
  amountEl.textContent       = formatINR(total);
  amountEl.style.fontSize    = '2rem';
  amountEl.style.color       = 'var(--brown)';
  descEl.textContent         = count + ' pizzas × ' + formatINR(rate) + ' (' + tierLabel + ') · Service time: ' + serviceTime + ' · Desserts not included.';
  descEl.style.color         = '';

  setHiddenField('estimateStatus',      'calculated');
  setHiddenField('estimatedUnitRate',   rate);
  setHiddenField('estimatedTotal',      total);
  setHiddenField('includedServiceTime', serviceTime);
}

function setHiddenField(name, value) {
  let el = document.querySelector('input[name="' + name + '"]');
  if (!el) {
    el = document.createElement('input');
    el.type = 'hidden';
    el.name = name;
    const form = document.getElementById('bookDateForm');
    if (form) form.appendChild(el);
  }
  el.value = value || '';
}

function toggleDateField(radio) {
  const wrap = document.getElementById('dateFieldWrap');
  const dateInput = document.getElementById('eventDate');
  if (!wrap || !dateInput) return;
  if (radio.value === 'fixed') {
    wrap.style.display = 'block';
    dateInput.required = true;
  } else {
    wrap.style.display = 'none';
    dateInput.required = false;
    dateInput.value = '';
  }
}

// ─── FORM SUBMISSION ────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('bookDateForm');
  if (!form) return;

  // Set timestamp
  const tsField = document.getElementById('submittedAt');
  if (tsField) tsField.value = new Date().toISOString();

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Basic validation
    const name  = form.querySelector('[name="name"]').value.trim();
    const phone = form.querySelector('[name="phone"]').value.trim();
    const venue = form.querySelector('[name="venue"]').value.trim();
    const pkg   = form.querySelector('[name="pizzaPackage"]').value;
    const count = parseInt(form.querySelector('[name="pizzaCount"]').value, 10);

    if (!name || !phone || !venue || !pkg || !count) {
      alert('Please fill in all required fields.');
      return;
    }

    if (phone.replace(/\D/g,'').length < 10) {
      alert('Please enter a valid phone number.');
      return;
    }

    if (count < 20) {
      alert('Minimum order is 20 pizzas. Please update your pizza count.');
      return;
    }

    const dateStatus = form.querySelector('[name="dateStatus"]:checked');
    if (!dateStatus) {
      alert('Please select your event date status.');
      return;
    }

    if (dateStatus.value === 'fixed') {
      const eventDate = form.querySelector('[name="eventDate"]').value;
      if (!eventDate) {
        alert('Please select your event date.');
        return;
      }
    }

    const setupType = form.querySelector('[name="setupType"]:checked');
    if (!setupType) {
      alert('Please select your setup type.');
      return;
    }

    // Update timestamp on submit
    const ts = document.getElementById('submittedAt');
    if (ts) ts.value = new Date().toISOString();

    // For the mock: show success state
    // In production: POST to /api/enquiry or Netlify Forms
    const formEl    = document.getElementById('bookDateForm');
    const successEl = document.getElementById('formSuccess');
    if (formEl && successEl) {
      formEl.style.display = 'none';
      successEl.classList.add('visible');
      window.scrollTo({ top: successEl.offsetTop - 100, behavior: 'smooth' });
    }
  });
});
