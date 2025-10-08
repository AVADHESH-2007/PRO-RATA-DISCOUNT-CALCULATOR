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
    '<td><input type="number" min="0" readonly value="" /></td>', // Discount Amt (readonly, styled)
    '<td><input type="text" value="" /></td>', // Remarks (editable, styled)
    '<td><input type="number" min="0" /></td>', // Discount PMT
    '<td><input type="number" min="0" readonly /></td>', // Diff. Days (readonly)
    '<td><input type="number" min="0" readonly /></td>' // Prop. Qty. (readonly)
  ];
  row.innerHTML = cells.join('');
  tbody.appendChild(row);
  updateSlNo();
  updateTotals();
  // Do NOT call updateTotals() or calculateRow here
}

// Update totals for Invoice Amount, Quantity, Payment Amount, Discount Amount
function updateTotals() {
  const rows = document.querySelectorAll('#tableBody tr');
  let totalQty = 0, totalInvAmt = 0, totalPayAmt = 0, totalDiscAmt = 0;
  rows.forEach(tr => {
    const tds = tr.querySelectorAll('td');
    totalQty += parseFloat(tds[7]?.querySelector('input')?.value) || 0;
    totalInvAmt += parseFloat(tds[9]?.querySelector('input')?.value) || 0;
    totalPayAmt += parseFloat(tds[12]?.querySelector('input')?.value) || 0;
    // Discount Amt is readonly input[type="number"]
    const discInput = tds[13]?.querySelector('input[type="number"][readonly]');
    totalDiscAmt += discInput ? (parseFloat(discInput.value) || 0) : 0;
  });
  const elQty = document.getElementById('totalQty');
  const elInv = document.getElementById('totalInvAmt');
  const elPay = document.getElementById('totalPayAmt');
  const elDisc = document.getElementById('totalDiscAmt');
  if (elQty) elQty.textContent = totalQty.toFixed(2);
  if (elInv) elInv.textContent = totalInvAmt.toFixed(2);
  if (elPay) elPay.textContent = totalPayAmt.toFixed(2);
  if (elDisc) elDisc.textContent = totalDiscAmt.toFixed(2);
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


// --- Calculation Logic ---
// All calculation for Unit Price, Diff. Days, Prop. Qty, Discount Amt, Balance Amt
// is now ONLY triggered by manualCalculate() (Calculate button)
// No auto-calculation on input or row changes.
function calculateRow(tr) {
  const tds = tr.querySelectorAll('td');
  // Editable fields
  const qty = parseFloat(tds[7]?.querySelector('input')?.value) || 0;
  const invAmt = parseFloat(tds[9]?.querySelector('input')?.value) || 0;
  const dueDate = tds[6]?.querySelector('input')?.value || '';
  const payDate = tds[11]?.querySelector('input')?.value || '';
  const payAmt = parseFloat(tds[12]?.querySelector('input')?.value) || 0;
  const discountPMT = parseFloat(tds[15]?.querySelector('input')?.value) || 0;

  // Compute values
  const result = computeRowValues({
    invoiceAmount: invAmt,
    quantity: qty,
    dueDate,
    paymentDate: payDate,
    paymentAmount: payAmt,
    discountPMT
  });

  // Set Unit Price (readonly)
  if (tds[8]?.querySelector('input')) {
    tds[8].querySelector('input').value = result.unitPrice;
  }
  // Set Discount Amt (readonly)
  // Discount Amt should be at index 13 (14th column) and must be input[type="number"][readonly]
  if (tds[13]) {
    const discountInput = tds[13].querySelector('input[type="number"][readonly]');
    if (discountInput) {
      discountInput.value = (result.discountAmt !== '' && !isNaN(result.discountAmt)) ? result.discountAmt : '0.00';
    }
  }
  // Set Diff. Days (readonly)
  if (tds[16]?.querySelector('input')) {
    tds[16].querySelector('input').value = result.diffDays;
  }
  // Set Prop. Qty. (readonly)
  if (tds[17]?.querySelector('input')) {
    tds[17].querySelector('input').value = result.propQty;
  }
}

// Calculate all rows
function calculateDiscounts() {
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;
  // For each row, calculate values
  Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
    calculateRow(tr);
  });
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
  // ...existing code...
}

// --- Add manual calculate function ---
function manualCalculate() {
  calculateDiscounts();
  updateTotals();
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
  const rows = [];
  document.querySelectorAll('#invoiceTable tr').forEach(tr => {
    const cells = Array.from(tr.querySelectorAll('th,td')).map(td => {
      if (td.querySelector('input')) return td.querySelector('input').value || '';
      return td.innerText;
    });
    // Reorder columns for CSV: Discount Amt, Remarks before Discount PMT, Diff. Days, Prop. Qty. (Balance Amt. removed)
    if (cells.length === 18) {
      // Move 16,17 to 13,14 (0-based)
      const reordered = [
        ...cells.slice(0,13), // up to Payment Amount
        cells[16], // Discount Amt
        cells[17], // Remarks
        cells[13], // Discount PMT
        cells[14], // Diff. Days
        cells[15]  // Prop. Qty.
      ];
      rows.push(reordered.join(','));
    } else {
      rows.push(cells.join(','));
    }
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
    // Split lines and filter out blank lines
    let lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return; // Must have at least header + 1 data row
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    // Assume first line is header, skip it
    let validDataRows = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      // Consider a row valid if at least one of the main columns has data
      if (cols.some(cell => cell && cell.trim() !== '')) {
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
          <td><input type="number" value="${cols[6] || ''}" min="0" readonly /></td>
          <td><input type="number" value="${cols[7] || ''}" min="0" /></td>
          <td><input type="text" value="${cols[8] || ''}" /></td>
          <td><input type="text" value="${cols[9] || ''}" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
          <td><input type="number" value="${cols[10] || ''}" min="0" /></td>
          <td><input type="number" value="${cols[11] || ''}" min="0" readonly /></td> <!-- Discount Amt -->
          <td><input type="text" value="${cols[12] || ''}" /></td> <!-- Remarks -->
          <td><input type="number" value="${cols[13] || ''}" min="0" /></td> <!-- Discount PMT -->
          <td><input type="number" value="${cols[14] || ''}" min="0" readonly /></td> <!-- Diff. Days -->
          <td><input type="number" value="${cols[15] || ''}" min="0" readonly /></td> <!-- Prop. Qty. -->
        `;
        tbody.appendChild(tr);
        bindRowEvents(tr);
        validDataRows++;
      }
    }
    updateSlNo();
    saveTableToStorage();
    // After loading rows from CSV, run client-side duplicate detection and highlight offending rows
    try {
      const records = getTableRecords();
      const dups = findDuplicatesInRecords(records);
      if (dups.length > 0) {
        const messages = dups.map(d => `${d.field === 'invoice_number' ? 'Invoice No.' : 'Payment Document No.'} [${d.value}]`);
        showErrorToUser(`Error: Duplicate entry found for ${messages.join('; ')}. Please verify and re-upload.`, dups);
        highlightDuplicateRows(dups);
      }
    } catch (e) { /* ignore validation errors */ }
    // Optionally, display validDataRows somewhere if you want to show the count
    // No calculation is triggered here
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
  updateTotals();
  updateSlNo();
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
    }
  });
  updateTotals();
  // updateTotals removed
}

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
  // 3. Proportional Quantity
  let propQty = 0;
  if (invoiceAmount > 0) {
    const effectivePayment = Math.min(paymentAmount, invoiceAmount);
    propQty = quantity * (effectivePayment / invoiceAmount);
  }
  // 4. Discount Amount
  let discountAmt = '';
  if (diffDaysNum > 0 && propQty > 0 && discountPMT > 0) {
    discountAmt = (discountPMT * diffDaysNum * propQty).toFixed(2);
  } else {
    discountAmt = '0.00';
  }
  return {
    unitPrice: unitPrice ? unitPrice.toFixed(2) : '',
    diffDays,
    propQty: propQty ? propQty.toFixed(2) : '',
    discountAmt
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
// Single startup handler: clear any saved table and show exactly one blank row.
window.addEventListener('DOMContentLoaded', () => {
  try { localStorage.removeItem('invoiceTable'); } catch (e) {}
  const tbody = document.getElementById('tableBody');
  if (tbody) {
    tbody.innerHTML = '';
    addRow();
    bindAllRows();
    updateSlNo();
  }
});

// Also run initialization immediately to handle cases where the script
// is loaded after DOMContentLoaded has already fired (ensures deterministic start).
function initStartup() {
  try { localStorage.removeItem('invoiceTable'); } catch (e) {}
  const tbody = document.getElementById('tableBody');
  if (tbody) {
    tbody.innerHTML = '';
    addRow();
    bindAllRows();
    updateSlNo();
  }
}
initStartup();

// loadTableFromStorage is defined earlier and used when an explicit load is required.

function downloadSampleCSV() {
  const header = [
    "Product Code", "Description", "INVOICE NO.", "Invoice Date", "Due Date",
    "Quantity", "Unit Price", "Invoice Amount", "Payment Doc", "Payment Date",
    "Payment Amount", "Discount Amt", "Remarks", "Discount PMT", "Diff. Days", "Prop. Qty."
  ];
  // All calculable fields (Unit Price, Discount Amt, Diff. Days, Prop. Qty.) are left blank
  const sample = [
    "PRD001", "Sample Product", "INV123", "01-06-2024", "30-06-2024",
    "10", "", "1000", "PAY456", "15-06-2024", "500", "", "Sample remark", "5", "", ""
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

// Collect table rows into a simple records array for validation/upload
function getTableRecords() {
  const rows = Array.from(document.querySelectorAll('#tableBody tr'));
  return rows.map(tr => {
    const tds = tr.querySelectorAll('td');
    return {
      productCode: tds[2]?.querySelector('input')?.value || '',
      description: tds[3]?.querySelector('input')?.value || '',
      invoice_number: tds[4]?.querySelector('input')?.value || '',
      invoiceDate: tds[5]?.querySelector('input')?.value || '',
      dueDate: tds[6]?.querySelector('input')?.value || '',
      quantity: tds[7]?.querySelector('input')?.value || '',
      unitPrice: tds[8]?.querySelector('input')?.value || '',
      invoiceAmount: tds[9]?.querySelector('input')?.value || '',
      paymentDoc: tds[10]?.querySelector('input')?.value || '',
      payment_document_number: tds[10]?.querySelector('input')?.value || '',
      paymentDate: tds[11]?.querySelector('input')?.value || '',
      paymentAmount: tds[12]?.querySelector('input')?.value || '',
      discountAmt: tds[13]?.querySelector('input')?.value || '',
      remarks: tds[14]?.querySelector('input')?.value || '',
      discountPMT: tds[15]?.querySelector('input')?.value || '',
      diffDays: tds[16]?.querySelector('input')?.value || '',
      propQty: tds[17]?.querySelector('input')?.value || ''
    };
  });
}

function generateSessionId() {
  // Simple session id using timestamp + random characters
  return 'sess-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,9);
}

// Called when user clicks Upload in the UI
async function onUploadFromUI() {
  const records = getTableRecords();
  const ok = await validateBeforeUpload(records);
  if (!ok) return; // validation will show errors

  // Attempt to POST to /upload; if server missing, fall back to showing success message
  try {
    const resp = await fetch('/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: null, upload_session_id: generateSessionId(), records })
    });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      showErrorToUser(data.message || 'Upload failed on server', data.duplicates || []);
      return;
    }
    alert('Upload succeeded');
  } catch (err) {
    console.warn('Upload endpoint not available; simulated upload succeeded (client-side only).');
    alert('Upload simulated (no server). Records validated locally.');
  }
}

function updateSlNo() {
  const rows = document.querySelectorAll('#tableBody tr');
  rows.forEach((tr, idx) => {
    const slNoCell = tr.querySelectorAll('td')[1];
    if (slNoCell) slNoCell.textContent = idx + 1;
  });
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
    // ...existing code...
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
      if (i === 5 || i === 6 || i === 9) {
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
  <td><input type="number" value="${cells[13] || ''}" min="0" readonly /></td> <!-- Discount Amt -->
  <td><input type="text" value="${cells[14] || ''}" /></td> <!-- Remarks -->
  <td><input type="number" value="${cells[15] || ''}" min="0" /></td> <!-- Discount PMT -->
  <td><input type="number" value="${cells[16] || ''}" min="0" readonly /></td> <!-- Diff. Days -->
  <td><input type="number" value="${cells[17] || ''}" min="0" readonly /></td> <!-- Prop. Qty. -->
    `;
    tbody.appendChild(tr);
    bindRowEvents(tr);
  });
  updateSlNo();
  // calculateDiscounts(); // Do not auto-calculate on load
  return true;
}

// --- Payment Adjustment Logic (NEW) ---
// Applies sequential, line-by-line payment adjustments per requirements.
function applyPaymentAdjustments() {
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;

  // Read existing rows into invoice objects
  const rows = Array.from(tbody.querySelectorAll('tr')).map((tr, idx) => {
    const tds = tr.querySelectorAll('td');
    const obj = {
      index: idx,
      productCode: tds[2]?.querySelector('input')?.value || '',
      description: tds[3]?.querySelector('input')?.value || '',
      invoiceNo: tds[4]?.querySelector('input')?.value || '',
      invoiceDate: tds[5]?.querySelector('input')?.value || '',
      dueDate: tds[6]?.querySelector('input')?.value || '',
      quantity: parseFloat(tds[7]?.querySelector('input')?.value) || 0,
      unitPrice: parseFloat(tds[8]?.querySelector('input')?.value) || 0,
      invoiceAmount: parseFloat(tds[9]?.querySelector('input')?.value) || 0,
      paymentDoc: tds[10]?.querySelector('input')?.value || '',
      paymentDate: tds[11]?.querySelector('input')?.value || '',
      paymentAmount: parseFloat(tds[12]?.querySelector('input')?.value) || 0,
      discountAmt: parseFloat(tds[13]?.querySelector('input')?.value) || 0,
      remarks: tds[14]?.querySelector('input')?.value || '',
      discountPMT: parseFloat(tds[15]?.querySelector('input')?.value) || 0,
      diffDays: parseFloat(tds[16]?.querySelector('input')?.value) || 0,
      propQty: parseFloat(tds[17]?.querySelector('input')?.value) || 0,
      remainingAmount: parseFloat(tds[9]?.querySelector('input')?.value) || 0,
      remainingQty: parseFloat(tds[7]?.querySelector('input')?.value) || 0,
      originalInvoiceAmount: parseFloat(tds[9]?.querySelector('input')?.value) || 0,
      originalQty: parseFloat(tds[7]?.querySelector('input')?.value) || 0
    };
    return obj;
  });

  // Prepare adjustments array per invoice
  const invoices = rows.map(r => {
    return {
      ...r,
      fragments: [] // each fragment: {amount, qty, paymentDoc, paymentDate, paymentAmount, sourcePaymentRowIndex}
    };
  });

  // Process payments sequentially: for each row (in order) treat its payment as a payment to allocate to earliest outstanding invoices
  invoices.forEach((invRow, payIndex) => {
    let paymentLeft = invRow.paymentAmount || 0;
    const payDoc = invRow.paymentDoc || '';
    const payDate = invRow.paymentDate || '';

    if (paymentLeft <= 0) return;

    // Allocate to earliest invoices with remainingAmount > 0
    for (let j = 0; j < invoices.length && paymentLeft > 0; j++) {
      const target = invoices[j];
      if (target.remainingAmount <= 0) continue;

      // Amount to apply to this target invoice
      const amountToApply = Math.min(paymentLeft, target.remainingAmount);
      if (amountToApply <= 0) continue;

      // Proportional quantity based on original invoice amount
      const qtyApplied = target.originalInvoiceAmount > 0
        ? (target.originalQty * (amountToApply / target.originalInvoiceAmount))
        : 0;

      // Record fragment on target invoice
      target.fragments.push({
        amount: Number(amountToApply.toFixed(2)),
        qty: Number(qtyApplied.toFixed(4)), // keep more precision for quantities
        paymentDoc: payDoc,
        paymentDate: payDate,
        paymentAmount: Number(amountToApply.toFixed(2)),
        sourcePaymentRow: payIndex
      });

      // Reduce remaining amounts/qty
      target.remainingAmount = Number((target.remainingAmount - amountToApply).toFixed(2));
      target.remainingQty = Number((target.remainingQty - qtyApplied).toFixed(4));

      // Reduce paymentLeft
      paymentLeft = Number((paymentLeft - amountToApply).toFixed(2));
    }
    // If any paymentLeft remains (should not, since it can apply to its own invoice too),
    // the logic above already attempts to apply to all invoices including current.
  });

  // After allocation, for each invoice create output fragments:
  const resultFragments = []; // ordered adjusted lines
  invoices.forEach(inv => {
    // If there were fragments (payments applied) create lines for each fragment in order
    if (inv.fragments.length > 0) {
      inv.fragments.forEach(frag => {
        // Use computeRowValues to calculate unitPrice, discount, diffDays, propQty based on fragment
        const computed = computeRowValues({
          invoiceAmount: frag.amount,
          quantity: frag.qty,
          dueDate: inv.dueDate,
          paymentDate: frag.paymentDate,
          paymentAmount: frag.paymentAmount,
          discountPMT: inv.discountPMT
        });

        resultFragments.push({
          productCode: inv.productCode,
          description: inv.description,
          invoiceNo: inv.invoiceNo,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate,
          quantity: frag.qty,
          unitPrice: computed.unitPrice,
          invoiceAmount: frag.amount,
          paymentDoc: frag.paymentDoc,
          paymentDate: frag.paymentDate,
          paymentAmount: frag.paymentAmount,
          discountAmt: computed.discountAmt || '0.00',
          remarks: (Math.abs(frag.amount - frag.paymentAmount) < 0.005) ? 'Adjusted' : inv.remarks,
          discountPMT: inv.discountPMT,
          diffDays: computed.diffDays,
          propQty: computed.propQty
        });
      });
    }

    // If remainingAmount > 0 create an unpaid fragment (the split line capturing differential)
    if (inv.remainingAmount > 0.0001) {
      const unpaidQty = inv.remainingQty;
      const computedUnpaid = computeRowValues({
        invoiceAmount: inv.remainingAmount,
        quantity: unpaidQty,
        dueDate: inv.dueDate,
        paymentDate: '', // no payment yet
        paymentAmount: 0,
        discountPMT: inv.discountPMT
      });

      resultFragments.push({
        productCode: inv.productCode,
        description: inv.description,
        invoiceNo: inv.invoiceNo,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        quantity: unpaidQty,
        unitPrice: computedUnpaid.unitPrice,
        invoiceAmount: Number(inv.remainingAmount.toFixed(2)),
        paymentDoc: '',
        paymentDate: '',
        paymentAmount: 0,
        discountAmt: '0.00',
        remarks: inv.remarks || '',
        discountPMT: inv.discountPMT,
        diffDays: computedUnpaid.diffDays,
        propQty: computedUnpaid.propQty
      });
    }

    // Edge case: if there were no fragments and no remaining (i.e., fully paid earlier),
    // nothing to add here because fragments would have covered full amount.
    // If invoice had no payment and no fragments (no payments applied), then add the original unchanged line
    if (inv.fragments.length === 0 && inv.remainingAmount === inv.originalInvoiceAmount) {
      // No payments touched this invoice; keep as-is
      const computedOrig = computeRowValues({
        invoiceAmount: inv.originalInvoiceAmount,
        quantity: inv.originalQty,
        dueDate: inv.dueDate,
        paymentDate: inv.paymentDate || '',
        paymentAmount: inv.paymentAmount || 0,
        discountPMT: inv.discountPMT
      });
      resultFragments.push({
        productCode: inv.productCode,
        description: inv.description,
        invoiceNo: inv.invoiceNo,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        quantity: inv.originalQty,
        unitPrice: computedOrig.unitPrice,
        invoiceAmount: Number(inv.originalInvoiceAmount.toFixed(2)),
        paymentDoc: inv.paymentDoc,
        paymentDate: inv.paymentDate,
        paymentAmount: Number(inv.paymentAmount.toFixed(2)),
        discountAmt: computedOrig.discountAmt || '0.00',
        remarks: inv.remarks || '',
        discountPMT: inv.discountPMT,
        diffDays: computedOrig.diffDays,
        propQty: computedOrig.propQty
      });
    }
  });

  // Replace table body with adjusted lines
  tbody.innerHTML = '';
  resultFragments.forEach(f => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="checkbox" /></td>
      <td></td>
      <td><input type="text" value="${escapeHtml(f.productCode)}" /></td>
      <td><input type="text" value="${escapeHtml(f.description)}" /></td>
      <td><input type="text" value="${escapeHtml(f.invoiceNo)}" /></td>
      <td><input type="text" value="${escapeHtml(f.invoiceDate)}" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
      <td><input type="text" value="${escapeHtml(f.dueDate)}" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
      <td><input type="number" value="${Number(f.quantity).toFixed(2)}" min="0" /></td>
      <td><input type="number" value="${f.unitPrice}" min="0" readonly /></td>
      <td><input type="number" value="${Number(f.invoiceAmount).toFixed(2)}" min="0" /></td>
      <td><input type="text" value="${escapeHtml(f.paymentDoc)}" /></td>
      <td><input type="text" value="${escapeHtml(f.paymentDate)}" class="date-input" maxlength="10" placeholder="DD-MM-YYYY" /></td>
      <td><input type="number" value="${Number(f.paymentAmount).toFixed(2)}" min="0" /></td>
      <td><input type="number" value="${Number(f.discountAmt).toFixed(2)}" min="0" readonly /></td>
      <td><input type="text" value="${escapeHtml(f.remarks)}" /></td>
      <td><input type="number" value="${Number(f.discountPMT).toFixed(2)}" min="0" /></td>
      <td><input type="number" value="${escapeFloat(f.diffDays)}" min="0" readonly /></td>
      <td><input type="number" value="${escapeFloat(f.propQty)}" min="0" readonly /></td>
    `;
    tbody.appendChild(tr);
    bindRowEvents(tr);
  });

  updateSlNo();
  updateTotals();
  saveTableToStorage();
}

// helper to escape input values to avoid breaking HTML
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// helper to format diffDays/propQty which can be 'N.A.' or numeric
function escapeFloat(v) {
  if (v === '' || v === null || v === undefined) return '';
  return (typeof v === 'number' || (!isNaN(Number(v)))) ? Number(v).toFixed(0) : String(v);
}

// Add "Apply Adjustments" button to the UI if not present
function ensureApplyAdjustmentsButton() {
  if (document.getElementById('applyAdjustmentsBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'applyAdjustmentsBtn';
  btn.type = 'button';
  btn.textContent = 'Apply Adjustments';
  btn.style.marginLeft = '8px';
  btn.addEventListener('click', () => {
    // confirm action (non-blocking short)
    if (!confirm('Apply sequential payment adjustments to the current table?')) return;
    applyPaymentAdjustments();
  });

  // Try to insert into a container if present, else append to body above the table
  const containerCandidates = ['controls', 'toolbar', 'buttonBar'];
  let inserted = false;
  for (const id of containerCandidates) {
    const el = document.getElementById(id);
    if (el) { el.appendChild(btn); inserted = true; break; }
  }
  if (!inserted) {
    // find invoice table and insert before it
    const table = document.getElementById('invoiceTable');
    if (table && table.parentNode) {
      table.parentNode.insertBefore(btn, table);
    } else {
      document.body.insertBefore(btn, document.body.firstChild);
    }
  }
}

// Ensure button creation on startup (both DOMContentLoaded and immediate init paths)
window.addEventListener('DOMContentLoaded', () => {
  ensureApplyAdjustmentsButton();
});

// Also when script runs after DOM already loaded
try { ensureApplyAdjustmentsButton(); } catch (e) {}

// script.js (frontend)
async function validateBeforeUpload(records) {
  // records: array of objects { invoice_number, payment_document_number, ... }
  // First run client-side validation to catch duplicates in the uploaded file/table itself.
  try {
    const localDuplicates = findDuplicatesInRecords(records);
    if (localDuplicates.length > 0) {
      const messages = localDuplicates.map(d => {
        return `Duplicate entry found for ${d.field === 'invoice_number' ? 'Invoice No.' : 'Payment Document No.'} [${d.value}]`;
      });
      const userMessage = `Error: ${messages.join('; ')}. Please verify and re-upload.`;
      showErrorToUser(userMessage, localDuplicates);
      return false;
    }

    // If a server endpoint exists, call it for server-side validation (database/staging check).
    // If the fetch fails (no server), we consider client-side validation sufficient to block duplicates present in the file.
    try {
      const resp = await fetch('/validate-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records })
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const message = data && data.message
          ? data.message
          : 'Error: Duplicate entries detected. Please verify and re-upload.';
        showErrorToUser(message, data.duplicates || []);
        return false;
      }
      return true;
    } catch (err) {
      // Network/server unavailable. Log and allow upload to proceed only if client-side validation passed.
      console.warn('Server-side validation not available, proceeding with client-side checks only.');
      return true;
    }
  } catch (err) {
    console.error('Validation process failed', err);
    showErrorToUser('Unexpected error during validation. Please try again.', []);
    return false;
  }
}

// Find duplicates within the provided records array (client-side).
function findDuplicatesInRecords(records) {
  const normalize = v => (v === null || v === undefined) ? '' : String(v).trim().toLowerCase();
  const invoiceMap = new Map();
  const paymentMap = new Map();
  records.forEach((rec, idx) => {
    const inv = normalize(rec.invoice_number || rec.invoiceNo || rec.invoice || '');
    const pay = normalize(rec.payment_document_number || rec.paymentDoc || rec.payment_document || '');
    if (inv) {
      if (!invoiceMap.has(inv)) invoiceMap.set(inv, []);
      invoiceMap.get(inv).push(idx);
    }
    if (pay) {
      if (!paymentMap.has(pay)) paymentMap.set(pay, []);
      paymentMap.get(pay).push(idx);
    }
  });

  const duplicates = [];
  invoiceMap.forEach((indices, value) => {
    if (indices.length > 1) duplicates.push({ field: 'invoice_number', value, recordIndices: indices, detected_in: 'client' });
  });
  paymentMap.forEach((indices, value) => {
    if (indices.length > 1) duplicates.push({ field: 'payment_document_number', value, recordIndices: indices, detected_in: 'client' });
  });
  return duplicates;
}

function showErrorToUser(message, duplicates) {
  // Example: display in a modal or alert; for demo console and alert used.
  console.error('Upload validation failed:', message, duplicates);
  // Example UI: display as formatted list with each duplicate and an explanation
  const details = (duplicates || []).map(d => {
    const userField = d.field === 'invoice_number' ? 'Invoice No.' : 'Payment Document No.';
    return `${userField} [${d.value}] (found in ${d.detected_in}) - records: ${d.recordIndices.join(', ')}`;
  }).join('\n');
  alert(`${message}\n\nDetails:\n${details}`);
}

// Visually mark duplicate rows in the table for easy identification
function highlightDuplicateRows(duplicates) {
  // Clear previous highlights
  document.querySelectorAll('#tableBody tr').forEach(tr => tr.style.outline = 'none');
  duplicates.forEach(d => {
    const idxs = d.recordIndices || [];
    idxs.forEach(i => {
      const tr = document.querySelectorAll('#tableBody tr')[i];
      if (tr) tr.style.outline = '3px solid rgba(255,0,0,0.35)';
    });
  });
}

// Example usage after parsing file to records
async function onUploadButtonClicked(parsedRecords) {
  const ok = await validateBeforeUpload(parsedRecords);
  if (!ok) return;
  // proceed to POST to /upload
  const resp = await fetch('/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: window.currentUserId || null,
      upload_session_id: generateSessionId(),
      records: parsedRecords
    })
  });
  if (resp.ok) {
    alert('Upload successful');
  } else {
    const data = await resp.json();
    alert('Upload failed: ' + (data && data.message ? data.message : 'Unknown error'));
  }
}
