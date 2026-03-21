// ===== VARDONIT script.js =====
 
function updateCounter() {
  const textarea = document.getElementById('postInput');
  const counter = document.getElementById('charCounter');
  const remaining = 500 - textarea.value.length;
 
  counter.textContent = remaining + ' characters remaining';
  counter.className = 'char-counter';
 
  if (remaining <= 50) counter.classList.add('danger');
  else if (remaining <= 100) counter.classList.add('warning');
}
 
function wrapText(before, after) {
  const textarea = document.getElementById('postInput');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);
  const newText = textarea.value.substring(0, start) + before + selected + after + textarea.value.substring(end);
  textarea.value = newText;
  textarea.focus();
  textarea.selectionStart = start + before.length;
  textarea.selectionEnd = end + before.length;
  updateCounter();
}
 
function showAlert(message, type = 'error') {
  const box = document.getElementById('alertBox');
  box.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => { box.innerHTML = ''; }, 4000);
}
 
async function createPost() {
  const username = document.getElementById('username').value.trim();
  const text = document.getElementById('postInput').value.trim();
 
  if (!username) {
    showAlert('Please enter your name.');
    document.getElementById('username').focus();
    return;
  }
 
  if (!text) {
    showAlert('Please write something before posting.');
    document.getElementById('postInput').focus();
    return;
  }
 
  try {
    const res = await fetch('/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, text })
    });
 
    if (!res.ok) throw new Error('Server error');
 
    // Save username so user can delete their own posts later
    const myNames = JSON.parse(localStorage.getItem('myNames') || '[]');
    if (!myNames.includes(username)) {
      myNames.push(username);
      localStorage.setItem('myNames', JSON.stringify(myNames));
    }
 
    window.location.href = 'success.html';
 
  } catch {
    showAlert('Server error. Make sure node server.js is running.');
  }
}
 
function handleEnter(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    createPost();
  }
}
 