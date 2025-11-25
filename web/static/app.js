(function () {
  const state = {
    user: null,
    categories: [],
  };

  const loginForm = document.getElementById('loginForm');
  const loginStatus = document.getElementById('loginStatus');
  const categorySection = document.getElementById('categorySection');
  const welcomeText = document.getElementById('welcomeText');
  const categorySelect = document.getElementById('categorySelect');
  const recommendBtn = document.getElementById('recommendBtn');
  const categoryStatus = document.getElementById('categoryStatus');
  const categoryPreview = document.getElementById('categoryPreview');
  const resultSection = document.getElementById('resultSection');
  const selectedCategory = document.getElementById('selectedCategory');
  const coursesContainer = document.getElementById('courses');

  function setStatus(el, msg, type) {
    el.textContent = msg || '';
    el.className = 'status ' + (type || '');
  }

  function persistUser(user) {
    state.user = user;
    if (user) {
      localStorage.setItem('learningUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('learningUser');
    }
  }

  function restoreUser() {
    const raw = localStorage.getItem('learningUser');
    if (!raw) return;
    try {
      const user = JSON.parse(raw);
      state.user = user;
      onLoginSuccess(user, false);
    } catch (e) {
      console.warn('failed to parse user cache', e);
    }
  }

  async function fetchJSON(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res.json();
  }

  function renderCategoryPreview(categories) {
    if (!categoryPreview) return;
    categoryPreview.innerHTML = '';
    categories.forEach((c) => {
      const card = document.createElement('div');
      card.className = 'category-card';
      if (c.accent) {
        card.style.borderColor = c.accent;
      }
      const sample = c.sampleUrl
        ? `<a href="${c.sampleUrl}" target="_blank">${c.sampleUrl.replace('https://', '')}</a>`
        : '준비 중';
      card.innerHTML = `
        <h3>${c.icon ? c.icon + ' ' : ''}${c.name}</h3>
        <p>${c.description}</p>
        <p style="margin-top:10px;font-size:13px;color:#cbd5f5;">${c.courseCount}개 강의 • 샘플: ${sample}</p>
      `;
      categoryPreview.appendChild(card);
    });
  }

  async function loadCategories() {
    if (state.categories.length) return;
    const data = await fetchJSON('/categories');
    state.categories = data.items;
    categorySelect.innerHTML = '';
    data.items.forEach((c) => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = `${c.icon ? c.icon + ' ' : ''}${c.name} · ${c.courseCount}개 강의`;
      categorySelect.appendChild(option);
    });
    renderCategoryPreview(data.items);
  }

  function renderCourses(payload) {
    if (!payload || !payload.courses) return;
    const badgeStyle = payload.category.accent ? `style="color:${payload.category.accent}"` : '';
    selectedCategory.innerHTML = `
      <p class="pill" ${badgeStyle}>
        ${payload.category.icon ? payload.category.icon + ' ' : ''}${payload.category.name} · ${payload.category.description || ''}
      </p>
    `;
    coursesContainer.innerHTML = '';
    payload.courses.forEach((course) => {
      const card = document.createElement('div');
      card.className = 'course-card';
      card.innerHTML = `
        <h3>${course.title}</h3>
        <p>제공: ${course.provider}</p>
        <p>기간: ${course.duration}</p>
        <p>레벨: ${course.level}</p>
        <a href="${course.url}" target="_blank" rel="noopener">강의 바로가기 →</a>
      `;
      coursesContainer.appendChild(card);
    });
    resultSection.classList.remove('hidden');
  }

  function toggleAuthenticatedUI(show) {
    if (show) {
      categorySection.classList.remove('hidden');
      welcomeText.textContent = `${state.user.full_name}님, 환영합니다! 관심 분야를 골라보세요.`;
      loginForm.querySelector('button').disabled = true;
    } else {
      categorySection.classList.add('hidden');
      resultSection.classList.add('hidden');
      loginForm.querySelector('button').disabled = false;
    }
  }

  async function onLoginSuccess(user, needLoadCategories = true) {
    persistUser(user);
    setStatus(loginStatus, `${user.full_name}님 로그인 완료`, 'ok');
    await (needLoadCategories ? loadCategories() : Promise.resolve());
    toggleAuthenticatedUI(true);
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = loginForm.username.value.trim();
    const password = loginForm.password.value.trim();
    if (!username || !password) {
      return setStatus(loginStatus, '아이디/비밀번호를 입력하세요.', 'err');
    }
    setStatus(loginStatus, '로그인 중...', '');
    try {
      const data = await fetchJSON('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      await onLoginSuccess(data);
    } catch (err) {
      setStatus(loginStatus, '로그인 실패: ' + err.message, 'err');
    }
  });

  recommendBtn.addEventListener('click', async () => {
    if (!state.user) return;
    setStatus(categoryStatus, '추천을 불러오는 중...', '');
    try {
      const data = await fetchJSON('/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: state.user.username, category: categorySelect.value }),
      });
      setStatus(categoryStatus, `${data.courses.length}개의 강의를 찾았습니다.`, 'ok');
      renderCourses(data);
    } catch (err) {
      setStatus(categoryStatus, '추천 실패: ' + err.message, 'err');
    }
  });

  restoreUser();
  if (state.user) {
    loadCategories().catch((err) => console.error('카테고리 로딩 실패', err));
  }
})();
