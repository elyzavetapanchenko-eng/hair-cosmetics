'use strict';
(() => {
  const EMAIL = 'elyzaveta.panchenko@gmail.com';
  const $ = (id) => document.getElementById(id);
  let activeModal = null;
  let previousFocus = null;
  let selectedProduct = '';

  function closeModal(restore = true) {
    if (!activeModal) return;
    activeModal.setAttribute('aria-hidden', 'true');
    activeModal = null;
    document.body.style.overflow = '';
    if (restore && previousFocus) previousFocus.focus();
  }
  function openModal(id) {
    const target = $(id);
    if (!target) return;
    const trigger = document.activeElement;
    closeModal(false);
    previousFocus = trigger;
    activeModal = target;
    target.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    target.querySelector('.modal-close').focus();
  }
  document.addEventListener('click', (event) => {
    const order = event.target.closest('.order-btn');
    const policy = event.target.closest('#openPolicy, .policy-link');
    const close = event.target.closest('[data-close="true"]');
    if (order) {
      selectedProduct = order.dataset.product;
      $('orderProduct').value = selectedProduct;
      $('orderProductLabel').textContent = selectedProduct;
      $('orderFeedback').replaceChildren();
      $('orderFeedback').className = 'feedback';
      openModal('orderModal');
      $('orderName').focus();
    } else if (policy) {
      event.preventDefault();
      openModal('policyModal');
    } else if (close) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (!activeModal) return;
    if (event.key === 'Escape') closeModal();
    if (event.key === 'Tab') {
      const nodes = [...activeModal.querySelectorAll('button,a[href],input,textarea,select,[tabindex="0"]')].filter((el) => !el.disabled && el.getClientRects().length);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  function prepareDraft(form, fields, feedback, product) {
    feedback.replaceChildren();
    feedback.className = 'feedback';
    const fail = (message, field) => {
      feedback.textContent = message;
      feedback.classList.add('error');
      field.setAttribute('aria-invalid', 'true');
      field.focus();
    };
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    if (!fields.name.value.trim()) return fail('Будь ласка, вкажіть ваше ім’я.', fields.name);
    const phone = fields.phone.value.trim();
    const digits = phone.replace(/\D/g, '');
    if (!/^[+\d\s().-]+$/.test(phone) || !/^(0\d{9}|380\d{9})$/.test(digits)) return fail('Вкажіть український телефон: +380 і 9 цифр або 0 і 9 цифр.', fields.phone);
    if (!fields.policy.checked) return fail('Підтвердьте згоду на обробку даних для відповіді на заявку.', fields.policy);
    const subject = product ? `Замовлення: ${product}` : 'Заявка на підбір догляду';
    const body = [subject, '', `Ім’я: ${fields.name.value.trim()}`, `Телефон: ${phone}`, product ? `Товар: ${product}` : '', `Коментар: ${fields.message.value.trim() || '—'}`, '', 'Прошу уточнити ціну, наявність та умови доставки.', 'Погоджуюся на обробку цих даних для відповіді на звернення.'].filter((line) => line !== null).join('\n');
    const text = document.createElement('p');
    text.textContent = 'Заявку підготовлено. Відкрийте лист і надішліть його зі своєї пошти. Сайт ще не надіслав дані.';
    const actions = document.createElement('div');
    actions.className = 'draft-actions';
    const mail = document.createElement('a');
    mail.className = 'btn primary';
    mail.textContent = 'Відкрити лист у пошті';
    mail.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'btn ghost';
    copy.textContent = 'Скопіювати заявку';
    const fallback = document.createElement('p');
    fallback.textContent = `Якщо пошта не відкрилася, скопіюйте текст і надішліть на ${EMAIL}.`;
    const preview = document.createElement('textarea');
    preview.className = 'draft-text';
    preview.readOnly = true;
    preview.setAttribute('aria-label', 'Текст підготовленої заявки');
    preview.value = body;
    copy.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(body);
        copy.textContent = 'Скопійовано';
      } catch {
        preview.focus(); preview.select();
        fallback.textContent = 'Текст виділено. Скопіюйте його та вставте у лист вручну.';
      }
    });
    actions.append(mail, copy);
    feedback.append(text, actions, fallback, preview);
  }
  $('contactForm').addEventListener('submit', (event) => {
    event.preventDefault();
    prepareDraft(event.currentTarget, { name: $('name'), phone: $('phone'), message: $('message'), policy: $('policy') }, $('formFeedback'), '');
  });
  $('orderForm').addEventListener('submit', (event) => {
    event.preventDefault();
    prepareDraft(event.currentTarget, { name: $('orderName'), phone: $('orderPhone'), message: $('orderMessage'), policy: $('orderPolicy') }, $('orderFeedback'), selectedProduct);
  });
  document.querySelectorAll('.cta-apply,.cta-consult').forEach((button) => button.addEventListener('click', () => {
    $('form').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    $('name').focus({ preventScroll: true });
    if (button.classList.contains('cta-consult')) $('message').value = 'Хочу консультацію щодо підбору догляду.';
  }));
  document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    document.querySelectorAll('.filter').forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    let count = 0;
    document.querySelectorAll('.system4-card').forEach((card) => {
      card.hidden = category !== 'all' && card.dataset.category !== category;
      if (!card.hidden) count++;
    });
    $('catalogCount').textContent = `${count} ${count === 12 || count === 5 ? 'засобів' : 'засоби'}`;
  }));
})();
