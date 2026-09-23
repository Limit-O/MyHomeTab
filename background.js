// 点击扩展工具栏图标 → 打开设置页
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
