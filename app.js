/* =========================================================================
   Systems Intelligence — Interactive layer
   - Nav scroll state + mobile menu
   - Mouse-tracking spotlights on .card
   - IntersectionObserver reveal-on-scroll
   - Scroll-linked hero parallax
   - Workflow ROI calculator
   ========================================================================= */

(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Nav: scroll state ---- */
  const nav = document.querySelector('.site-nav');
  const onScroll = () => {
    if (!nav) return;
    if (window.scrollY > 8) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Nav: mobile menu toggle ---- */
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.mobile-menu');
  const iconOpen = document.querySelector('.nav-toggle .icon-open');
  const iconClose = document.querySelector('.nav-toggle .icon-close');

  const setMenu = (open) => {
    if (!menu) return;
    menu.classList.toggle('open', open);
    toggle?.setAttribute('aria-expanded', String(open));
    if (iconOpen && iconClose) {
      iconOpen.style.display = open ? 'none' : 'block';
      iconClose.style.display = open ? 'block' : 'none';
    }
    document.body.style.overflow = open ? 'hidden' : '';
  };

  toggle?.addEventListener('click', () => {
    setMenu(!menu?.classList.contains('open'));
  });
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('resize', () => { if (window.innerWidth > 768) setMenu(false); });

  /* ---- Mouse-tracking spotlight on cards ---- */
  if (!prefersReduced) {
    const cards = document.querySelectorAll('.card, .spotlight');
    cards.forEach(card => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---- Reveal on scroll ---- */
  const targets = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && targets.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(t => io.observe(t));
  } else {
    targets.forEach(t => t.classList.add('visible'));
  }

  /* ---- Hero visual: subtle cursor-tilt on the workflow mock ---- */
  const tilt = document.querySelector('[data-tilt]');
  if (tilt && !prefersReduced) {
    const damp = 25;
    tilt.addEventListener('pointermove', (e) => {
      const r = tilt.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width - 0.5;
      const cy = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `perspective(1200px) rotateY(${cx * damp * 0.4}deg) rotateX(${-cy * damp * 0.3}deg)`;
    });
    tilt.addEventListener('pointerleave', () => {
      tilt.style.transform = 'perspective(1200px) rotateY(0) rotateX(0)';
    });
  }

  /* ---- ROI calculator: workflow cleanup and automation estimate ---- */
  const roiCalculator = document.querySelector('[data-roi-calculator]');
  if (roiCalculator) {
    const defaults = {
      teamSize: 12,
      manualHours: 6,
      hourlyCost: 65,
      handoffs: 45,
      errorRate: 8,
      errorCost: 180,
      toolSpend: 1800,
      toolOverlap: 20,
      adminHours: 18,
      implementation: 12000,
      support: 900,
      adoption: 80
    };

    const workflowNames = {
      onboarding: 'Onboarding',
      property: 'Property or asset management',
      casework: 'Case consults',
      training: 'Training and coaching',
      reporting: 'Reporting',
      custom: 'Operations'
    };

    const scenarioMultipliers = {
      conservative: 0.75,
      expected: 1,
      aggressive: 1.22
    };

    let activeScenario = 'expected';

    const fieldInputs = Array.from(roiCalculator.querySelectorAll('[data-roi-field]'));
    const roiForm = roiCalculator.querySelector('form');
    const workflowSelect = roiCalculator.querySelector('[data-roi-workflow]');
    const scenarioButtons = Array.from(roiCalculator.querySelectorAll('[data-roi-scenario]'));
    const resetButton = roiCalculator.querySelector('[data-roi-reset]');
    const meter = roiCalculator.querySelector('[data-roi-meter]');
    const outputs = {};
    const bars = {};

    roiCalculator.querySelectorAll('[data-roi-output]').forEach((el) => {
      outputs[el.dataset.roiOutput] = el;
    });
    roiCalculator.querySelectorAll('[data-roi-bar]').forEach((el) => {
      bars[el.dataset.roiBar] = el;
    });

    const currency = new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      maximumFractionDigits: 0
    });
    const wholeNumber = new Intl.NumberFormat('en-NZ', { maximumFractionDigits: 0 });
    const oneDecimal = new Intl.NumberFormat('en-NZ', { maximumFractionDigits: 1 });

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const getField = (key) => {
      const numberInput = fieldInputs.find(input => input.dataset.roiField === key && input.type === 'number');
      const rangeInput = fieldInputs.find(input => input.dataset.roiField === key && input.type === 'range');
      return Number(numberInput?.value || rangeInput?.value || defaults[key] || 0);
    };

    const setField = (key, value) => {
      fieldInputs
        .filter(input => input.dataset.roiField === key)
        .forEach((input) => {
          input.value = String(value);
        });
    };

    const setOutput = (key, value) => {
      const el = outputs[key];
      if (!el || el.textContent === value) return;
      el.textContent = value;
      if (!prefersReduced) {
        el.classList.add('updating');
        window.setTimeout(() => el.classList.remove('updating'), 180);
      }
    };

    const formatPayback = (months) => {
      if (!Number.isFinite(months)) return 'Not yet';
      if (months < 1) return '<1 mo';
      if (months > 60) return '60+ mo';
      return `${oneDecimal.format(months)} mo`;
    };

    const largestValueKey = (values) => Object.entries(values).reduce((best, current) => {
      return current[1] > best[1] ? current : best;
    }, ['', -Infinity])[0];

    const updateCalculator = () => {
      const values = Object.keys(defaults).reduce((acc, key) => {
        acc[key] = Math.max(0, getField(key));
        return acc;
      }, {});

      const scenario = scenarioMultipliers[activeScenario] || 1;
      const adoption = clamp(values.adoption / 100, 0, 1);
      const weeklyManualHours = values.teamSize * values.manualHours;
      const manualRecoveryRate = clamp(0.38 * adoption * scenario, 0, 0.72);
      const errorReductionRate = clamp(0.58 * adoption * scenario, 0, 0.86);
      const toolRecoveryRate = clamp(0.76 * adoption * scenario, 0, 0.95);
      const adminRecoveryRate = clamp(0.48 * adoption * scenario, 0, 0.84);

      const timeSavings = weeklyManualHours * 52 * manualRecoveryRate * values.hourlyCost;
      const errorSavings = values.handoffs * 52 * (values.errorRate / 100) * values.errorCost * errorReductionRate;
      const toolSavings = values.toolSpend * 12 * (values.toolOverlap / 100) * toolRecoveryRate;
      const adminSavings = values.adminHours * 12 * values.hourlyCost * adminRecoveryRate;
      const grossAnnualValue = timeSavings + errorSavings + toolSavings + adminSavings;
      const annualSupport = values.support * 12;
      const yearOneCost = values.implementation + annualSupport;
      const netYearOne = grossAnnualValue - yearOneCost;
      const monthlyNetBenefit = (grossAnnualValue / 12) - values.support;
      const paybackMonths = monthlyNetBenefit > 0 ? values.implementation / monthlyNetBenefit : Infinity;
      const roiPercent = yearOneCost > 0 ? (netYearOne / yearOneCost) * 100 : 0;
      const weeklyHours = (weeklyManualHours * manualRecoveryRate) + ((values.adminHours * adminRecoveryRate) / 4.33);
      const yearTwoValue = (grossAnnualValue * 2) - values.implementation - (annualSupport * 2);
      const yearThreeValue = (grossAnnualValue * 3) - values.implementation - (annualSupport * 3);

      const fitScore = clamp(
        (weeklyManualHours / 120) * 28 +
        (values.handoffs / 120) * 20 +
        (values.errorRate / 20) * 16 +
        (values.toolOverlap / 45) * 16 +
        (adoption * 20),
        0,
        100
      );

      const workflow = workflowNames[workflowSelect?.value || 'custom'] || workflowNames.custom;
      const grossText = currency.format(grossAnnualValue);
      const summary = netYearOne >= 0
        ? `${workflow} could create ${grossText} in annual value before project costs, with a projected payback of ${formatPayback(paybackMonths)}.`
        : `${workflow} shows ${grossText} in annual value before project costs. The assumptions may need a tighter scope or a stronger adoption plan.`;

      const fitLabel = fitScore >= 72
        ? `High fit (${wholeNumber.format(fitScore)}/100)`
        : fitScore >= 48
          ? `Worth mapping (${wholeNumber.format(fitScore)}/100)`
          : `Needs discovery (${wholeNumber.format(fitScore)}/100)`;

      const valueBySource = {
        time: timeSavings,
        error: errorSavings,
        tool: toolSavings,
        admin: adminSavings
      };
      const biggestDriver = largestValueKey(valueBySource);
      const priorityCopy = {
        time: [
          'Start with process mapping',
          'Most of the value is hiding in manual work. Map the workflow, remove duplicated steps, then automate only the stable parts.'
        ],
        error: [
          'Stabilise handoffs first',
          'Rework is the biggest leak. Standardising intake, approvals, and status changes should come before adding more tools.'
        ],
        tool: [
          'Clean up the stack',
          'Tool overlap is material. A vendor-neutral audit can show which subscriptions to retire, consolidate, or connect.'
        ],
        admin: [
          'Automate reporting and support',
          'Tool admin is a recurring drag. Centralised data, reliable syncs, and documented ownership should move first.'
        ]
      }[biggestDriver] || [
        'Find the highest-leverage workflow',
        'Your estimate will identify whether process cleanup, automation, or tool consolidation should come first.'
      ];

      setOutput('netYearOne', currency.format(netYearOne));
      setOutput('roiPercent', `${wholeNumber.format(roiPercent)}%`);
      setOutput('payback', formatPayback(paybackMonths));
      setOutput('weeklyHours', `${oneDecimal.format(weeklyHours)}/wk`);
      setOutput('threeYearValue', currency.format(yearThreeValue));
      setOutput('timeSavings', currency.format(timeSavings));
      setOutput('errorSavings', currency.format(errorSavings));
      setOutput('toolSavings', currency.format(toolSavings));
      setOutput('adminSavings', currency.format(adminSavings));
      setOutput('fitLabel', fitLabel);
      setOutput('priorityTitle', priorityCopy[0]);
      setOutput('priorityText', priorityCopy[1]);
      setOutput('summary', summary);

      if (meter) {
        meter.style.width = `${clamp(fitScore, 4, 100)}%`;
      }

      const barValues = {
        year1: netYearOne,
        year2: yearTwoValue,
        year3: yearThreeValue
      };
      const maxBar = Math.max(...Object.values(barValues).map(value => Math.abs(value)), 1);
      Object.entries(barValues).forEach(([key, value]) => {
        const bar = bars[key];
        if (!bar) return;
        const height = clamp((Math.abs(value) / maxBar) * 100, 8, 100);
        bar.style.setProperty('--bar-height', `${height}%`);
        bar.classList.toggle('negative', value < 0);
        bar.setAttribute('title', currency.format(value));
      });
    };

    fieldInputs.forEach((input) => {
      input.addEventListener('input', () => {
        fieldInputs
          .filter(other => other !== input && other.dataset.roiField === input.dataset.roiField)
          .forEach((other) => {
            other.value = input.value;
          });
        updateCalculator();
      });

      input.addEventListener('change', () => {
        if (input.type !== 'number') return;
        const min = Number(input.min || 0);
        const max = Number(input.max || Number.MAX_SAFE_INTEGER);
        const value = clamp(Number(input.value || 0), min, max);
        setField(input.dataset.roiField, value);
        updateCalculator();
      });
    });

    roiForm?.addEventListener('submit', (event) => {
      event.preventDefault();
    });

    scenarioButtons.forEach((button) => {
      button.addEventListener('click', () => {
        activeScenario = button.dataset.roiScenario || 'expected';
        scenarioButtons.forEach((other) => {
          other.setAttribute('aria-pressed', String(other === button));
        });
        updateCalculator();
      });
    });

    workflowSelect?.addEventListener('change', updateCalculator);

    resetButton?.addEventListener('click', () => {
      Object.entries(defaults).forEach(([key, value]) => setField(key, value));
      activeScenario = 'expected';
      scenarioButtons.forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.roiScenario === activeScenario));
      });
      if (workflowSelect) workflowSelect.value = 'onboarding';
      updateCalculator();
    });

    updateCalculator();
  }
})();
