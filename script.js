document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const navList = document.getElementById('navList');
  const contentInner = document.getElementById('contentInner');
  const quickNav = document.getElementById('quickNav');
  const searchInput = document.getElementById('searchInput');
  const searchNextBtn = document.getElementById('searchNextBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const backToTopBtn = document.getElementById('backToTopBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  const fontBtns = document.querySelectorAll('.font-size-btn');
  const contentArea = document.getElementById('contentArea');
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  
  let currentUnitIndex = 0;
  let searchMatches = [];
  let currentSearchIndex = -1;

  // Render Navigation
  function renderNav(highlightTerm = '') {
    navList.innerHTML = '';
    const units = window.UNITS_DATA || [];
    
    units.forEach((unit, index) => {
      // 若有搜尋關鍵字，依據內文與標題決定是否顯示
      if (highlightTerm) {
        const t = highlightTerm.toLowerCase();
        const contentMatch = (unit.content || '').toLowerCase().includes(t);
        const titleMatch = (unit.title || '').toLowerCase().includes(t);
        if (!contentMatch && !titleMatch) return; // 不符合條件的隱藏
      }

      const li = document.createElement('li');
      li.className = 'nav-item';
      li.dataset.index = index;
      
      // 若有縮階層或是特殊格式，可在此判斷 (目前階層均拉平) 
      li.textContent = unit.title;
      
      if (index === currentUnitIndex) {
        li.classList.add('active');
        
        // 若沒有搜尋字詞，預設不顯示子層級 (因應使用者要求簡化目錄)
        // (開發備註：若有提示詞特別指示要顯示次層級，可在此處加回繪製 <ul> 的邏輯)

      }
      
      li.addEventListener('click', (e) => {
        if(e.target === li) {
          currentUnitIndex = index;
          // 重新載入並帶有搜尋反白效果
          loadUnit(index, searchInput.value.trim());
          // 重新繪製以便把子層級展開
          renderNav(searchInput.value.trim());
        }
      });
      navList.appendChild(li);
    });
  }

  // Load Unit Content
  function loadUnit(index, highlightTerm = '') {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const targetNav = document.querySelector(`.nav-item[data-index="${index}"]`);
    if (targetNav) targetNav.classList.add('active');
    
    const unit = window.UNITS_DATA[index];
    if (!unit) return;

    // Parse Markdown to HTML
    let htmlContent = marked.parse(unit.content);
    
    // Highlight Text logic
    if (highlightTerm) {
       const regex = new RegExp(`(${highlightTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
       // Avoid replacing inside HTML tags
       const parts = htmlContent.split(/(<[^>]*>)/g);
       for (let i = 0; i < parts.length; i++) {
         if (!parts[i].startsWith('<')) {
           parts[i] = parts[i].replace(regex, '<mark class="search-match">$1</mark>');
         }
       }
       htmlContent = parts.join('');
    }
    
    contentInner.innerHTML = htmlContent;
    
    searchMatches = Array.from(contentInner.querySelectorAll('mark.search-match'));
    currentSearchIndex = -1;
    
    // Highlight codes using highlight.js
    contentInner.querySelectorAll('pre code').forEach((el) => {
      hljs.highlightElement(el);
    });
    
    // Build Quick Nav 內部大綱按鈕
    quickNav.innerHTML = '';
    if (unit.headings && unit.headings.length > 0) {
      // 標註大綱區塊前綴
      const titleSpan = document.createElement('span');
      titleSpan.textContent = '📍 頁面導航：';
      titleSpan.style.color = '#718096';
      titleSpan.style.fontWeight = 'bold';
      titleSpan.style.lineHeight = '34px';
      quickNav.appendChild(titleSpan);

      // 預設僅列該頁面之第一層(level === 2)當作導航，簡化畫面 (若有提示詞指示，也可在此動態調整濾出條件)
      unit.headings.filter(h => h.level === 2).forEach((heading) => {
        const btn = document.createElement('button');
        btn.textContent = heading.text;
        btn.addEventListener('click', () => {
          // 在 contentInner 裡面找標題文字相符的節點
          const headers = Array.from(contentInner.querySelectorAll('h1, h2, h3, h4, h5, h6'));
          // Marked.js 可能會去掉特殊字元，所以採用 contains 比對文字
          const target = headers.find(el => el.textContent.includes(heading.text));
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
        quickNav.appendChild(btn);
      });
    } else {
      quickNav.style.display = 'none';
    }
    if(unit.headings && unit.headings.length > 0) quickNav.style.display = 'flex';
    
    // Reset scroll position
    contentArea.scrollTop = 0;
    
    // Close mobile menu if open
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  }

  // --- Search functionality ---
  if(searchNextBtn) {
    searchNextBtn.addEventListener('click', () => {
      if(searchMatches.length === 0) return;
      
      // 移除上一個 match 的 current-match class
      if(currentSearchIndex >= 0 && currentSearchIndex < searchMatches.length) {
        searchMatches[currentSearchIndex].classList.remove('current-match');
      }
      
      currentSearchIndex = (currentSearchIndex + 1) % searchMatches.length;
      const target = searchMatches[currentSearchIndex];
      target.classList.add('current-match');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  searchInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') {
      e.preventDefault();
      if(searchNextBtn) searchNextBtn.click();
    }
  });

  searchInput.addEventListener('input', () => {
    const term = searchInput.value.trim();
    renderNav(term); // 重新過濾目錄清單
    
    // 如果有結果，自動加載第一個
    const firstItem = navList.querySelector('.nav-item');
    if (firstItem) {
      currentUnitIndex = parseInt(firstItem.dataset.index);
      loadUnit(currentUnitIndex, term);
      renderNav(term); // Re-render to show sub-list of the highlighted item if needed
    } else {
      contentInner.innerHTML = '<p>找不到符合的內容。</p>';
      searchMatches = [];
      quickNav.style.display = 'none';
    }
  });

  // --- Fullscreen functionality ---
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      fullscreenBtn.innerHTML = "🗗 離開";
    } else {
      document.exitFullscreen();
      fullscreenBtn.innerHTML = "⛶ 全螢幕";
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      fullscreenBtn.innerHTML = "⛶ 全螢幕";
    }
  });

  // --- Font Size Settings ---
  const savedFont = localStorage.getItem('siteFontSize') || 'medium';
  document.body.classList.remove('font-medium', 'font-large', 'font-xlarge');
  document.body.classList.add(`font-${savedFont}`);
  
  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // 防止點擊向外傳播
    settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
  });

  document.addEventListener('click', (e) => {
    if(!settingsPanel.contains(e.target) && e.target !== settingsBtn) {
      settingsPanel.style.display = 'none';
    }
  });

  fontBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const size = e.target.dataset.size;
      document.body.classList.remove('font-medium', 'font-large', 'font-xlarge');
      document.body.classList.add(`font-${size}`);
      localStorage.setItem('siteFontSize', size);
      settingsPanel.style.display = 'none';
    });
  });

  // --- Back to Top functionality ---
  contentArea.addEventListener('scroll', () => {
    if (contentArea.scrollTop > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    contentArea.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // --- Mobile Menu ---
  menuToggle.addEventListener('click', () => {
    sidebar.classList.add('open');
    overlay.classList.add('active');
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  });

  // --- Sidebar resizer ---
  const resizer = document.getElementById('resizer');
  let isResizing = false;

  resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizer.classList.add('resizing');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none'; // 防止拖拉時選到文字
    sidebar.style.transition = 'none';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    let newWidth = e.clientX;
    const minWidth = 200;
    const maxWidth = 600;
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      document.documentElement.style.setProperty('--sidebar-width', newWidth + 'px');
    }
  });

  window.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      resizer.classList.remove('resizing');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      sidebar.style.transition = '';
    }
  });

  // --- Init ---
  if (window.UNITS_DATA && window.UNITS_DATA.length > 0) {
    renderNav();
    loadUnit(0);
  } else {
    contentInner.innerHTML = '<p>尚無任何對應的 Markdown 文件。</p>';
  }
});
