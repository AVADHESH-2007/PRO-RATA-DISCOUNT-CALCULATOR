function addRow() {
  const tbody = document.getElementById('tableBody');
  const rowCount = tbody.children.length + 1;
  const row = document.createElement('tr');
  const cells = [
    '<td><input type="checkbox"/></td>',
    `<td>${rowCount}</td>`,
    '<td><input type="text"/></td>', // Product Code
    '<td><input type="text"/></td>', // Description
    '<td><input type="text"/></td>', // Invoice #
    '<td><input type="text" class="date-input" maxlength="10" placeholder="DD-MM-YYYY"/></td>', // Invoice Date
    '<td><input type="text" class="date-input" maxlength="10" placeholder="DD-MM-YYYY"/></td>', // Due Date
    '<td><input type="number" min="0"/></td>', // Quantity
    '<td><input type="number" min="0" readonly/></td>', // Unit Price (readonly)
    '<td><input type="number" min="0"/></td>', // Invoice Amount
    '<td><input type="text"/></td>', // Payment Doc
    '<td><input type="text" class="date-input" maxlength="10" placeholder="DD-MM-YYYY"/></td>', // Payment Date
    '<td><input type="number" min="0"/></td>', // Payment Amount
    '<td><input type="number" min="0" placeholder="Discount PMT"/></td>', // Discount PMT (editable)
    '<td></td>', // Diff. Days (readonly, text for N.A.)
    '<td></td>', // Prop. Qty. (readonly)
    '<td class="discount-amount">-</td>', // Discount Amt (readonly, not input)
    '<td><input type="number" readonly /></td>', // Balance Amt. (readonly)
    '<td><input type="text"/></td>' // Remarks (editable)
  ];
  row.innerHTML = cells.join('');
  tbody.appendChild(row);
  updateSlNo();
  updateTotals();
}

// Helper: Parse DD-MM-YYYY to Date object
function parseDDMMYYYY(str) {
  if (!str) return null;
  const [dd, mm, yyyy] = str.split('-').map(Number);
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd);
}

// Helper to get formatted date as DD-MM-YYYY
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d)) return date;
  let day = '' + d.getDate();
  let month = '' + (d.getMonth() + 1);
  let year = d.getFullYear();
  if (day.length < 2) day = '0' + day;
  if (month.length < 2) month = '0' + month;
  return [day, month, year].join('-');
}

// Helper to generate a unique payment number
function generatePaymentNumber() {
  // Simple unique number using timestamp and random
  return 'PAY' + Date.now() + Math.floor(Math.random() * 1000);
}

// --- Calculation Logic ---
function calculateRow(tr) {
  const tds = tr.querySelectorAll('td');
  // Editable fields
  const qty = parseFloat(tds[7]?.querySelector('input')?.value);
  const invAmt = parseFloat(tds[9]?.querySelector('input')?.value);
  const payAmt = parseFloat(tds[12]?.querySelector('input')?.value);
  const discPmt = parseFloat(tds[13]?.querySelector('input')?.value);

  // Dates
  const dueDateStr = tds[6]?.querySelector('input')?.value;
  const payDateStr = tds[11]?.querySelector('input')?.value;

  // --- Diff. Days ---
  let diffDays = '';
  if (dueDateStr && payDateStr) {
    const [d1, m1, y1] = dueDateStr.split('-').map(Number);
    const [d2, m2, y2] = payDateStr.split('-').map(Number);
    const dueDate = new Date(y1, m1 - 1, d1);
    const payDate = new Date(y2, m2 - 1, d2);
    if (!isNaN(dueDate) && !isNaN(payDate)) {
      if (payDate > dueDate) {
        diffDays = "N.A.";
      } else {
        diffDays = Math.round((dueDate - payDate) / (1000 * 60 * 60 * 24));
      }
    }
  }
  if (tds[14]) tds[14].textContent = diffDays !== '' ? diffDays : '';

  // --- Unit Price ---
  let unitPrice = (typeof qty === "number" && qty > 0 && typeof invAmt === "number" && !isNaN(invAmt)) ? (invAmt / qty) : '';
  if (tds[8]?.querySelector('input')) {
    tds[8].querySelector('input').value = unitPrice !== '' && !isNaN(unitPrice) ? unitPrice.toFixed(2) : '';
  }

  // --- Prop. Qty. ---
  let propQty = (typeof unitPrice === "number" && unitPrice > 0 && typeof payAmt === "number" && !isNaN(payAmt)) ? (payAmt / unitPrice) : '';
  if (tds[15]) tds[15].textContent = propQty !== '' && !isNaN(propQty) ? propQty.toFixed(2) : '';

  // --- Discount Amount ---
  let discAmt = '';
  if (
    typeof discPmt === "number" && !isNaN(discPmt) &&
    diffDays !== '' && diffDays !== "N.A." &&
    typeof diffDays === "number" && !isNaN(diffDays) &&
    typeof propQty === "number" && !isNaN(propQty)
  ) {
    discAmt = discPmt * diffDays * propQty;
    if (tds[16]) tds[16].textContent = discAmt.toFixed(2);
  } else {
    if (tds[16]) tds[16].textContent = "N.A.";
    discAmt = "N.A.";
  }

  // --- Balance Amt ---
  let balAmt = '';
  if (
    typeof invAmt === "number" && !isNaN(invAmt) &&
    typeof payAmt === "number" && !isNaN(payAmt) &&
    typeof discAmt === "number" && !isNaN(discAmt)
  ) {
    balAmt = (invAmt - payAmt - discAmt).toFixed(2);
  } else {
    balAmt = "N.A.";
  }
  if (tds[17]?.querySelector('input')) {
    tds[17].querySelector('input').value = balAmt;
  }

  // --- Remark Logic ---
  // If Invoice Amount = Payment Amount, set Remark as "Adjusted"
  if (
    typeof invAmt === "number" && typeof payAmt === "number" &&
    !isNaN(invAmt) && !isNaN(payAmt) &&
    Math.abs(invAmt - payAmt) < 0.01 // allow floating point tolerance
  ) {
    if (tds[18]?.querySelector('input')) {
      tds[18].querySelector('input').value = "Adjusted";
    }
  }

  // PAYMENT ADJUSTMENT LOGIC-1

  // Remove any existing adjustment row immediately after this row
  if (tr.nextSibling && tr.nextSibling.classList?.contains('discount-adjust-row')) {
    tr.nextSibling.remove();
  }

  // If negative Balance Amount, insert new payment row
  if (
    typeof balAmt === "string" && !isNaN(Number(balAmt)) &&
    Number(balAmt) < 0 &&
    !tr.classList.contains('discount-adjust-row') // Prevent duplicate for adjustment rows
  ) {
    const tbody = tr.parentElement;
    const originalPaymentDoc = tds[10]?.querySelector('input')?.value || 'PAY';

    // Count existing adjustment rows for this payment doc
    let adjustmentCount = 1;
    tbody.querySelectorAll('tr.discount-adjust-row').forEach(adjRow => {
      const adjDocInput = adjRow.querySelectorAll('td')[10]?.querySelector('input');
      if (adjDocInput && adjDocInput.value.startsWith(originalPaymentDoc + '-')) {
        adjustmentCount++;
      }
    });

    // Generate payment number as "old payment doc no - n"
    const newPaymentNumber = `${originalPaymentDoc}-${adjustmentCount}`;

    // Always calculate balance amount, treat "N.A." as 0
    let paymentAmt = Math.abs(Number(balAmt));
    let invoiceAmt = 0;
    let discountAmt = 0; // Always 0 for this row
    let balanceAmt = (invoiceAmt - paymentAmt - discountAmt).toFixed(2);

    const newTr = document.createElement('tr');
    newTr.classList.add('discount-adjust-row');
    newTr.innerHTML = `
      <td><input type="checkbox" /></td>
      <td></td>
      <td><input type="text" value="" /></td>
      <td><input type="text" value="" /></td>
      <td><input type="text" value="" /></td>
      <td><input type="text" value="" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
      <td><input type="text" value="" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
      <td><input type="number" value="" min="0" /></td>
      <td><input type="number" value="" min="0" readonly /></td>
      <td><input type="number" value="" min="0" /></td> <!-- Invoice Amount blank -->
      <td><input type="text" value="${newPaymentNumber}" /></td>
      <td><input type="text" value="" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
      <td><input type="number" value="${paymentAmt.toFixed(2)}" min="0" /></td>
      <td><input type="number" value="" min="0" /></td>
      <td></td>
      <td></td>
      <td></td>
      <td><input type="number" readonly value="${balanceAmt}" /></td>
      <td><input type="text" value="Amount to be adjusted of discount" /></td>
    `;
    // Insert after current row
    if (tr.nextSibling) {
      tbody.insertBefore(newTr, tr.nextSibling);
    } else {
      tbody.appendChild(newTr);
    }
    bindRowEvents(newTr);
    updateSlNo();
    // No need to call calculateRow for this row, as values are set directly
    saveTableToStorage();
  }

  // PAYMENT ADJUSTMENT LOGIC – CASE 2:
  if (
    typeof invAmt === "number" && typeof payAmt === "number" &&
    !isNaN(invAmt) && !isNaN(payAmt) &&
    invAmt < payAmt &&
    !tr.classList.contains('discount-adjust-row') &&
    !tr.classList.contains('excess-payment-row')
  ) {
    // 1. Set Remark as "Adjusted" and Payment Amount = Invoice Amount
    if (tds[18]?.querySelector('input')) {
      tds[18].querySelector('input').value = "Adjusted";
    }
    if (tds[12]?.querySelector('input')) {
      tds[12].querySelector('input').value = invAmt.toFixed(2);
    }

    // Remove any existing excess/disc adjustment rows after this row
    let next = tr.nextSibling;
    while (next && (next.classList?.contains('excess-payment-row') || next.classList?.contains('discount-adjust-row'))) {
      let toRemove = next;
      next = next.nextSibling;
      toRemove.remove();
    }

    const tbody = tr.parentElement;

    // 2. Excess Payment Row
    const originalPayAmt = payAmt;
    const excessAmt = (originalPayAmt - invAmt).toFixed(2);
    if (excessAmt > 0) {
      const excessBalAmt = (0 - Number(excessAmt) - 0).toFixed(2);
      const excessTr = document.createElement('tr');
      excessTr.classList.add('excess-payment-row');
      excessTr.innerHTML = `
        <td><input type="checkbox" /></td>
        <td></td>
        <td><input type="text" value="" /></td>
        <td><input type="text" value="" /></td>
        <td><input type="text" value="" /></td>
        <td><input type="text" value="" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
        <td><input type="text" value="" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
        <td><input type="number" value="" min="0" /></td>
        <td><input type="number" value="" min="0" readonly /></td>
        <td><input type="number" value="" min="0" /></td>
        <td><input type="text" value="${tds[10]?.querySelector('input')?.value || ''}" /></td>
        <td><input type="text" value="${tds[11]?.querySelector('input')?.value || ''}" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
        <td><input type="number" value="${excessAmt}" min="0" /></td>
        <td><input type="number" value="" min="0" /></td>
        <td></td>
        <td></td>
        <td></td>
        <td><input type="number" readonly value="${excessBalAmt}" /></td>
        <td><input type="text" value="Excess payment" /></td>
      `;
      // Insert after current row
      if (tr.nextSibling) {
        tbody.insertBefore(excessTr, tr.nextSibling);
      } else {
        tbody.appendChild(excessTr);
      }
      bindRowEvents(excessTr);
      updateSlNo();
    }

    // 3. Discount Adjustment Row
    let discAmtVal = tds[16]?.textContent;
    if (discAmtVal && !isNaN(Number(discAmtVal)) && Number(discAmtVal) > 0) {
      const originalPaymentDoc = tds[10]?.querySelector('input')?.value || 'PAY';
      let adjustmentCount = 1;
      tbody.querySelectorAll('tr.discount-adjust-row').forEach(adjRow => {
        const adjDocInput = adjRow.querySelectorAll('td')[10]?.querySelector('input');
        if (adjDocInput && adjDocInput.value.startsWith(originalPaymentDoc + '-')) {
          adjustmentCount++;
        }
      });
      const newPaymentNumber = `${originalPaymentDoc}-${adjustmentCount}`;
      const discBalAmt = (0 - Number(discAmtVal) - 0).toFixed(2);

      const discTr = document.createElement('tr');
      discTr.classList.add('discount-adjust-row');
      discTr.innerHTML = `
        <td><input type="checkbox" /></td>
        <td></td>
        <td><input type="text" value="" /></td>
        <td><input type="text" value="" /></td>
        <td><input type="text" value="" /></td>
        <td><input type="text" value="" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
        <td><input type="text" value="" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
        <td><input type="number" value="" min="0" /></td>
        <td><input type="number" value="" min="0" readonly /></td>
        <td><input type="number" value="" min="0" /></td>
        <td><input type="text" value="${newPaymentNumber}" /></td>
        <td><input type="text" value="" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
        <td><input type="number" value="${Number(discAmtVal).toFixed(2)}" min="0" /></td>
        <td><input type="number" value="" min="0" /></td>
        <td></td>
        <td></td>
        <td></td>
        <td><input type="number" readonly value="${discBalAmt}" /></td>
        <td><input type="text" value="Amount to be adjusted of discount" /></td>
      `;
      // Insert after excess payment row if present, else after main row
      let insertAfter = tr.nextSibling && tr.nextSibling.classList.contains('excess-payment-row')
        ? tr.nextSibling
        : tr;
      if (insertAfter.nextSibling) {
        tbody.insertBefore(discTr, insertAfter.nextSibling);
      } else {
        tbody.appendChild(discTr);
      }
      bindRowEvents(discTr);
      updateSlNo();
    }
    saveTableToStorage();
  }
}

// Calculate all rows
function calculateDiscounts() {
  document.querySelectorAll('#tableBody tr').forEach(tr => calculateRow(tr));
}

// --- Remove all auto-calculation triggers ---
// (Comment out or delete the following blocks)

// document.getElementById('tableBody').addEventListener('input', function(e) {
//   if (e.target.matches('input[type="text"], input[type="number"]')) {
//     autoCalculateAll();
//   }
// });

// In bindRowEvents, remove calculation on input
function bindRowEvents(tr) {
  tr.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
    if (!input.readOnly) {
      // Only save, do NOT calculate
      input.addEventListener('input', saveTableToStorage);
    }
  });
  tr.querySelector('input[type="checkbox"]').addEventListener('change', saveTableToStorage);
}

// Remove autoCalculateAll from window.onload, DOMContentLoaded, etc.

// --- Add manual calculate function ---
function manualCalculate() {
  calculateDiscounts();
  updateTotals();
  saveTableToStorage();
}

// --- Event Binding ---
function bindRowEvents(tr) {
  tr.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
    if (!input.readOnly) {
        // Remove or comment out this part:
        // input.addEventListener('input', () => {
        //   calculateRow(tr);
        //   saveTableToStorage();
        // });
    }
  });
  // Also save when checkbox is toggled (for select/deselect)
  tr.querySelector('input[type="checkbox"]').addEventListener('change', saveTableToStorage);
}

// Bind events for all rows (existing and future)
function bindAllRows() {
  document.querySelectorAll('#tableBody tr').forEach(tr => bindRowEvents(tr));
}

// Initial calculation on page load
function exportCSV() {
  updateSlNo();
  updateTotals();
  const rows = [];
  document.querySelectorAll('#invoiceTable tr').forEach(tr => {
    const cells = Array.from(tr.querySelectorAll('th,td')).map(td => {
      if (td.querySelector('input')) return td.querySelector('input').value || '';
      return td.innerText;
    });
    rows.push(cells.join(','));
  });
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'discounts.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.trim().split('\n');
    if (lines.length < 2) return;
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    // Get header to determine mapping
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      // Map CSV columns to table columns
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="checkbox" /></td>
        <td></td>
        <td><input type="text" value="${cols[0] || ''}" /></td>
        <td><input type="text" value="${cols[1] || ''}" /></td>
        <td><input type="text" value="${cols[2] || ''}" /></td>
        <td><input type="text" value="${cols[3] || ''}" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
        <td><input type="text" value="${cols[4] || ''}" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
        <td><input type="number" value="${cols[5] || ''}" min="0" /></td>
        <td><input type="number" value="" min="0" readonly /></td>
        <td><input type="number" value="${cols[7] || ''}" min="0" /></td>
        <td><input type="text" value="${cols[8] || ''}" /></td>
        <td><input type="text" value="${cols[9] || ''}" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
        <td><input type="number" value="${cols[10] || ''}" min="0" /></td>
        <td><input type="number" value="${cols[11] || ''}" min="0" placeholder="Discount PMT" /></td>
        <td></td>
        <td></td>
        <td class="discount-amount">-</td>
        <td><input type="number" readonly /></td>
        <td><input type="text" value="${cols[16] || ''}" /></td>
      `;
      tbody.appendChild(tr);
      bindRowEvents(tr);
    }
    updateSlNo();
    saveTableToStorage();
  };
  reader.readAsText(file);
}

function selectAll() {
  const checkboxes = document.querySelectorAll('#tableBody tr td:first-child input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
  });
}

function deselectAll() {
  const checkboxes = document.querySelectorAll('#tableBody tr td:first-child input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
}

function removeSelected() {
  const rows = document.querySelectorAll('#tableBody tr');
  rows.forEach(row => {
    const checkbox = row.querySelector('input[type="checkbox"]');
    if (checkbox && checkbox.checked) {
      row.remove();
    }
  });
  updateSlNo();
  updateTotals();
}

function resetSelected() {
  const rows = document.querySelectorAll('#tableBody tr');
  rows.forEach(row => {
    const checkbox = row.querySelector('input[type="checkbox"]');
    if (checkbox && checkbox.checked) {
      const inputs = row.querySelectorAll('input[type="text"], input[type="number"]');
      inputs.forEach(input => {
        if (!input.hasAttribute('readonly')) input.value = '';
      });
      row.querySelector('.discount-amount').textContent = '-';
    }
  });
  updateTotals();
}

window.onload = function () {
  addRow();
  updateTotals();
};

// After all rows are added:
function computeRowValues({invoiceAmount, quantity, dueDate, paymentDate, paymentAmount, discountPMT}) {
  // Parse dates
  function parseDDMMYYYY(str) {
    if (!str) return null;
    const [dd, mm, yyyy] = str.split('-').map(Number);
    if (!dd || !mm || !yyyy) return null;
    return new Date(yyyy, mm - 1, dd);
  }
  // 1. Unit Price
  const unitPrice = quantity > 0 ? invoiceAmount / quantity : 0;
  // 2. Diff. Days
  let diffDays = '';
  let diffDaysNum = 0;
  if (dueDate && paymentDate) {
    const dDue = parseDDMMYYYY(dueDate);
    const dPay = parseDDMMYYYY(paymentDate);
    if (dDue && dPay) {
      const days = Math.round((dDue - dPay) / (1000 * 60 * 60 * 24));
      if (days > 0) {
        diffDays = days;
        diffDaysNum = days;
      } else {
        diffDays = 'N.A.';
        diffDaysNum = 0;
      }
    }
  }
  // 3. Prop Qty
  let propQty = 0;
  if (invoiceAmount > 0) {
    propQty = quantity * (paymentAmount / invoiceAmount);
  }
  // 4. Discount Amount
  let discountAmt = 0;
  if (diffDaysNum > 0 && propQty > 0 && discountPMT > 0) {
    discountAmt = discountPMT * diffDaysNum * propQty;
  }
  // 5. Net Due
  let netDue = invoiceAmount - paymentAmount - discountAmt;

  return {
    unitPrice: unitPrice ? unitPrice.toFixed(2) : '',
    diffDays,
    propQty: propQty ? propQty.toFixed(2) : '',
    discountAmt: discountAmt ? discountAmt.toFixed(2) : '0.00',
    netDue: (invoiceAmount > 0 || paymentAmount > 0 || discountAmt > 0) ? netDue.toFixed(2) : ''
  };
}

// Optional: force date input to DD-MM-YYYY format
document.addEventListener('input', function(e) {
  if (e.target.classList.contains('date-input')) {
    let v = e.target.value.replace(/[^0-9]/g, '');
    if (v.length > 2) v = v.slice(0,2) + '-' + v.slice(2);
    if (v.length > 5) v = v.slice(0,5) + '-' + v.slice(5,9);
    e.target.value = v.slice(0,10);
  }
});

// --- Initial Bindings ---
window.addEventListener('DOMContentLoaded', () => {
  localStorage.removeItem('invoiceTable'); // Always clear storage on load
  document.getElementById('tableBody').innerHTML = '';
  addRow();
  bindAllRows();
});

function loadTableFromStorage() {
  const rows = JSON.parse(localStorage.getItem('invoiceTable'));
  if (!rows || !Array.isArray(rows) || rows.length === 0) return false;
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';
  rows.forEach((row, idx) => {
    const tr = document.createElement('tr');
    const cells = Object.values(row).filter((_, i) => !isNaN(i)).map((cell, i) => {
      if (i === 5 || i === 6 || i === 11) {
        return formatDate(cell);
      }
      return cell;
    });
    tr.innerHTML = `
      <td><input type="checkbox" /></td>
      <td></td>
      <td><input type="text" value="${cells[2] || ''}" /></td>
      <td><input type="text" value="${cells[3] || ''}" /></td>
      <td><input type="text" value="${cells[4] || ''}" /></td>
      <td><input type="text" value="${cells[5] || ''}" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
      <td><input type="text" value="${cells[6] || ''}" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
      <td><input type="number" value="${cells[7] || ''}" min="0" /></td>
      <td><input type="number" value="${cells[8] || ''}" min="0" readonly /></td>
      <td><input type="number" value="${cells[9] || ''}" min="0" /></td>
      <td><input type="text" value="${cells[10] || ''}" /></td>
      <td><input type="text" value="${cells[11] || ''}" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
      <td><input type="number" value="${cells[12] || ''}" min="0" /></td>
      <td><input type="number" value="${cells[13] || ''}" min="0" /></td>
      <td>${cells[14] || ''}</td>
      <td>${cells[15] || ''}</td>
      <td class="discount-amount">${cells[16] || '-'}</td>
      <td><input type="number" value="${cells[17] || ''}" readonly /></td>
      <td><input type="text" value="${cells[18] || ''}" /></td>
    `;
    tbody.appendChild(tr);
    bindRowEvents(tr);
  });
  updateSlNo();
  // calculateDiscounts(); // Do not auto-calculate on load
  return true;
}

function downloadSampleCSV() {
  const header = [
    "Product Code", "Description", "INVOICE NO.", "Invoice Date", "Due Date",
    "Quantity", "Unit Price", "Invoice Amount", "Payment Doc", "Payment Date",
    "Payment Amount", "Discount PMT", "Diff. Days", "Prop. Qty.", "Discount Amount",
    "Balance Amount", "Remarks"
  ];
  const sample = [
    "PRD001", "Sample Product", "INV123", "01-06-2024", "30-06-2024",
    "10", "", "1000", "PAY456", "15-06-2024", "500", "5", "", "", "", "", "Sample remark"
  ];
  const csvContent = header.join(',') + '\n' + sample.join(',');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample_discount.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function updateSlNo() {
  const rows = document.querySelectorAll('#tableBody tr');
  rows.forEach((tr, idx) => {
    const slNoCell = tr.querySelectorAll('td')[1];
    if (slNoCell) slNoCell.textContent = idx + 1;
  });
}

function updateTotals() {
  const tFoot = document.getElementById('tableFoot');
  if (!tFoot) return;
  const rows = document.querySelectorAll('#tableBody tr');
  let totalInvAmt = 0, totalPayAmt = 0, totalDiscAmt = 0, totalBalAmt = 0;
  rows.forEach(tr => {
    const tds = tr.querySelectorAll('td');
    const invAmt = parseFloat(tds[9]?.querySelector('input')?.value) || 0;
    const payAmt = parseFloat(tds[12]?.querySelector('input')?.value) || 0;
    const discAmt = parseFloat(tds[16]?.textContent) || 0;
    const balAmt = parseFloat(tds[17]?.querySelector('input')?.value) || 0;
    totalInvAmt += invAmt;
    totalPayAmt += payAmt;
    totalDiscAmt += discAmt;
    totalBalAmt += balAmt;
  });
  const footerCells = [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    totalInvAmt.toFixed(2),
    '',
    totalPayAmt.toFixed(2),
    totalDiscAmt.toFixed(2),
    '',
    '',
    '',
    totalBalAmt.toFixed(2),
    ''
  ];
  tFoot.querySelector('tr').innerHTML = footerCells.map(cell => `<td>${cell}</td>`).join('');
}

// Local Storage
function saveTableToStorage() {
  const rows = [];
  document.querySelectorAll('#tableBody tr').forEach(tr => {
    const row = {};
    tr.querySelectorAll('td').forEach((td, idx) => {
      const input = td.querySelector('input');
      if (input) {
        row[idx] = input.value;
      } else {
        row[idx] = td.textContent;
      }
    });
    // Save if this is an adjustment row
    if (tr.classList.contains('discount-adjust-row')) {
      row['adjustment'] = true;
    }
    rows.push(row);
  });
  localStorage.setItem('invoiceTable', JSON.stringify(rows));
}

function loadTableFromStorage() {
  const rows = JSON.parse(localStorage.getItem('invoiceTable'));
  if (!rows || !Array.isArray(rows) || rows.length === 0) return false;
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';
  rows.forEach((row, idx) => {
    const tr = document.createElement('tr');
    const cells = Object.values(row).filter((_, i) => !isNaN(i)).map((cell, i) => {
      if (i === 5 || i === 6 || i === 11) {
        return formatDate(cell);
      }
      return cell;
    });
    tr.innerHTML = `
      <td><input type="checkbox" /></td>
      <td></td>
      <td><input type="text" value="${cells[2] || ''}" /></td>
      <td><input type="text" value="${cells[3] || ''}" /></td>
      <td><input type="text" value="${cells[4] || ''}" /></td>
      <td><input type="text" value="${cells[5] || ''}" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
      <td><input type="text" value="${cells[6] || ''}" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
      <td><input type="number" value="${cells[7] || ''}" min="0" /></td>
      <td><input type="number" value="${cells[8] || ''}" min="0" readonly /></td>
      <td><input type="number" value="${cells[9] || ''}" min="0" /></td>
      <td><input type="text" value="${cells[10] || ''}" /></td>
      <td><input type="text" value="${cells[11] || ''}" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
      <td><input type="number" value="${cells[12] || ''}" min="0" /></td>
      <td><input type="number" value="${cells[13] || ''}" min="0" /></td>
      <td>${cells[14] || ''}</td>
      <td>${cells[15] || ''}</td>
      <td class="discount-amount">${cells[16] || '-'}</td>
      <td><input type="number" value="${cells[17] || ''}" readonly /></td>
      <td><input type="text" value="${cells[18] || ''}" /></td>
    `;
    tbody.appendChild(tr);
    bindRowEvents(tr);
  });
  updateSlNo();
  // calculateDiscounts(); // Do not auto-calculate on load
  return true;
}

function manualCalculate() {
  calculateDiscounts();
  updateTotals();
  saveTableToStorage();
}

localStorage.removeItem('invoiceTable');
