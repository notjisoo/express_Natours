/* eslint-disable */
import pxmu from 'pxmu';

// export const hideAler = () => {
//   const el = document.querySelector('.alert');
//   if (el) el.parentElement.removeChild('el');
// };

// type is 'success' or 'error
export const showAlert = (type, msg) => {
  pxmu.toast({
    msg,
    status: type,
    time: 2500,
    bg: type === 'success' ? 'rgba(1, 203, 92)' : 'rgba(239, 0, 27)',
    color: '#fff',
    location: 'top',
    animation: 'slidedown',
  });
};

export const isLoading = (msg, flag) => {
  // let bg =
  //   msg === '修改成功!!!' ? 'rbga(1,200,91,0.65)' : 'rgba(0, 0, 0, 0.65)';

  pxmu.loading({
    msg, //loading信息 为空时不显示文本
    time: 2500, //停留时间
    // 1, 200, 91
    bg: 'rbga(1,200,91)', //背景色
    color: '#fff', //文字颜色
    animation: 'fade', //动画名 详见动画文档
    close: false, // 自动关闭 为false时可在业务完成后调用 pxmu.closeload();手动关闭
    inscroll: false, //模态 不可点击和滚动
    inscrollbg: 'rgba(0, 0, 0, 0.45)', //自定义遮罩层颜色 为空不显示遮罩层
  });

  if (flag !== 1) pxmu.closeload(100); //延时100毫秒关闭 默认0
};
