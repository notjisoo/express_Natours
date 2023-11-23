class APIFeatures {
  // 接受传递来的参数，Tour.find() 它会返回一个query对象，利用这个对象可以使用他prototype身上的方法，第二个参数是你路径的参数 这里必须返回this对象就是query对象，不然不能接着使用方法
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // Build query
    // 1A) Filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      // 减号代表降序，加号代表升序，默认是加号，可以传入Object or String,还有字符数组或者number数组， String需要用空格隔开
      this.query = this.query.sort(sortBy);
    } else this.query = this.query.sort('-createdAt');
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      //可以传入«Object|String|Array[String]»，String一样需要空格隔开, default + , + is included, - is excluded
      this.query = this.query.select(fields);
    } else this.query = this.query.select('-__v');
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
