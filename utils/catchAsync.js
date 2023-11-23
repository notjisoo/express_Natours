// 传入了一个函数，这个函数是Async函数，所以你可以用catch
// 然后返回一个匿名函数，匿名函数会有三个值，是给外面用的 exports.createTour = ((req,res,next)=>{})
// 接着调用传进来的函数，并且接受他传的值
module.exports = (fn) => (req, res, next) => {
  // cathc(err => next(err)) 简写如下,因为是promise，所以会自动帮我调用next并且传入err
  // 当接收到了next(err)就会去找globalError中的函数调用返回对应的错误信息
  fn(req, res, next).catch(next);
};
