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
