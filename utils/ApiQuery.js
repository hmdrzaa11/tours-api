class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    let query = { ...this.queryString };
    let excludeProps = ["page", "sort", "limit", "fields"];
    for (let key in query) {
      if (excludeProps.includes(key)) {
        delete query[key];
      }
    }
    let stringQuery = JSON.parse(
      JSON.stringify(query).replace(/\b(gte|gt|lt|lte)\b/g, (str) => `$${str}`)
    );
    this.query.find(stringQuery);
    return this;
  }
  sort() {
    if (this.queryString.sort) {
      let sort = this.queryString.sort.join(" ");
      this.query.sort(sort);
      return this;
    } else {
      this.query.sort("-createdAt");
      return this;
    }
  }
  limitFields() {
    if (this.queryString.fields) {
      let fields = this.queryString.fields.split(",").join(" ");
      this.query.select(fields);
      return this;
    } else {
      return this;
    }
  }
  async paginate() {
    let page = this.queryString.page * 1 || 1; //default 1
    let limit = this.queryString.limit * 1 || 100; // default 100
    let skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = ApiFeatures;
