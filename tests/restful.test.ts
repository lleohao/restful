import { get, request, createServer, Server } from 'http';
import * as should from 'should';
import { Restful, Parser, Resource } from '../lib';


describe('Restful tets', () => {
    describe('API test', () => {
        let api: Restful;
        beforeEach(() => {
            api = new Restful(5051);
        })

        it('返回restful实例', () => {
            should(api).instanceOf(Restful);
        })

        it('不添加 resource 抛出 RestfulError', () => {
            should.throws(() => {
                api.start()
            });
        })

        it('添加重复路径 resource 抛出 RestfulError', () => {
            class Todos extends Resource {
                get() {
                    return {
                        data: 'ok'
                    };
                }
            }
            api.addSource(new Todos(), '/todos');
            should.throws(() => {
                api.addSource(new Todos(), '/todos');
            })
        })

        it('正确开启服务器', (done) => {
            class Todos extends Resource {
                get() {
                    return {
                        data: 'ok'
                    };
                }
            }
            api.addSource(new Todos(), '/todos');
            api.start();

            get({
                hostname: 'localhost',
                port: 5051,
                path: '/todos'
            }, (res) => {
                let data = [];
                res.on('data', (chunk) => {
                    data.push(chunk)
                }).on('end', () => {
                    data = JSON.parse(data.toString());
                    should(data).be.eql({
                        code: 200,
                        message: 'success',
                        data: 'ok'
                    });
                    done();
                    api.stop();
                })
            })
        })

        it('正确添加 parser 实例', (done) => {
            let parser = new Parser();
            parser.addParam('title');
            class Demo extends Resource {
                @Resource.addParser(parser)
                post({ title }) {
                    return { data: title }
                }
            }
            api.addSource(new Demo(), '/demo');
            api.start();
            let req = request({
                hostname: 'localhost',
                port: 5051,
                method: 'post',
                path: '/demo',
                headers: {
                    'Content-Type': 'application/json'
                }
            }, (res) => {
                let data = [];
                res.on('data', (chunk) => {
                    data.push(chunk)
                }).on('end', () => {
                    data = JSON.parse(data.toString());
                    should(data).be.eql({
                        code: 200,
                        message: 'success',
                        data: 'demo'
                    });
                    api.stop();
                    done();
                })
            });
            req.write(JSON.stringify({ title: 'demo' }));
            req.end();
        });

        it('正确解析路由参数', (done) => {
            class Books extends Resource {
                get({ id, page }) {
                    return {
                        data: {
                            id: id,
                            page: page
                        }
                    }
                }
            }
            api.addSource(new Books(), '/books/<id>/<page>');
            api.start();
            get({
                hostname: 'localhost',
                port: 5051,
                path: '/books/1/25'
            }, (res) => {
                let data = [];
                res.on('data', (chunk) => {
                    data.push(chunk)
                }).on('end', () => {
                    data = JSON.parse(data.toString());
                    should(data).be.eql({
                        code: 200,
                        message: 'success',
                        data: {
                            id: '1',
                            page: '25'
                        }
                    });
                    api.stop();
                    done();
                })
            })
        })

        it('错误路径测试', (done) => {
            class Books extends Resource {
                get({ id, page }) {
                    return {
                        data: {
                            id: id,
                            page: page
                        }
                    }
                }
            }
            api.addSource(new Books(), '/books/<id>/<page>');
            api.start();
            get({
                hostname: 'localhost',
                port: 5051,
                path: '/book'
            }, (res) => {
                let data = [];
                res.on('data', (chunk) => {
                    data.push(chunk)
                }).on('end', () => {
                    data = JSON.parse(data.toString());
                    should(data).be.eql({
                        code: 404,
                        message: 'This url does not have a corresponding resource'
                    });
                    api.stop();
                    done();
                })
            })
        })

        it('访问未定义方法测试', (done) => {
            class Books extends Resource {
                get({ id, page }) {
                    return {
                        data: {
                            id: id,
                            page: page
                        }
                    }
                }
            }
            api.addSource(new Books(), '/books/<id>/<page>');
            api.start();
            let req = request({
                hostname: 'localhost',
                port: 5051,
                path: '/books/1/25',
                method: 'post'
            }, (res) => {
                let data = [];
                res.on('data', (chunk) => {
                    data.push(chunk)
                }).on('end', () => {
                    data = JSON.parse(data.toString());
                    should(data).be.eql({
                        code: 400,
                        error: {
                            message: 'post method is undefined.'
                        }
                    });
                    api.stop();
                    done();
                })
            })
            req.end();
        })

        it('错误请求方式测试', (done) => {
            let parser = new Parser();
            parser.addParam('id');
            parser.addParam('page');
            class Books extends Resource {
                @Resource.addParser(parser)
                post({ id, page }) {
                    return {
                        data: {
                            id: id,
                            page: page
                        }
                    }
                }
            }
            api.addSource(new Books(), '/books');
            api.start();
            let req = request({
                hostname: 'localhost',
                port: 5051,
                path: '/books',
                method: 'post',
                headers: {
                    'Content-Type': 'text/xml'
                }
            }, (res) => {
                let data = [];
                res.on('data', (chunk) => {
                    data.push(chunk)
                }).on('end', () => {
                    data = JSON.parse(data.toString());
                    should(data).be.eql({
                        code: 403,
                        error: { error: { type: 1, info: 'This request method is not supported' } }
                    })
                    api.stop();
                    done();
                })
            })
            req.write(JSON.stringify({ id: 1, page: 22 }))
            req.end();
        })
    })

    describe('bindServer test', () => {
        let server: Server;
        let api;

        class Test extends Resource {
            get() {
                return {
                    data: 'restful request'
                };
            }
        }

        before(() => {
            server = <Server>createServer();
            api = new Restful();
            api.addSource(Test, '/api');
            api.bindServer(server);

            server.listen(5052);
        })

        after(() => {
            server.close();
        })

        it('正确响应API请求', (done) => {
            get({
                port: 5052,
                path: '/api'
            }, (res) => {
                let data = [];
                res.on('data', (chunk) => {
                    data.push(chunk);
                }).on('end', () => {
                    should(JSON.parse(data.toString())).be.eql({
                        code: 200,
                        data: 'restful request',
                        message: 'success'
                    })
                    done();
                })
            })
        })
    })

    describe('addSourceMap test', () => {
        let api: Restful;

        class Test1 extends Resource {
            get() {
                return {
                    data: 'restful request1'
                };
            }
        }

        class Test2 extends Resource {
            get() {
                return {
                    data: 'restful request2'
                };
            }
        }

        before(() => {
            api = new Restful();
            api.addSourceMap({
                '/test1': new Test1(),
                '/test2': new Test2(),
            })
            api.start();
        })

        after(() => {
            api.stop();
        })

        it('正确响应test1', (done) => {
            get({
                port: 5050,
                path: '/test1'
            }, (res) => {
                let data = [];
                res.on('data', (chunk) => {
                    data.push(chunk);
                }).on('end', () => {
                    should(JSON.parse(data.toString())).be.eql({
                        code: 200,
                        data: 'restful request1',
                        message: 'success'
                    })
                    done();
                })
            })
        })

        it('正确响应test2', (done) => {
            get({
                port: 5050,
                path: '/test2'
            }, (res) => {
                let data = [];
                res.on('data', (chunk) => {
                    data.push(chunk);
                }).on('end', () => {
                    should(JSON.parse(data.toString())).be.eql({
                        code: 200,
                        data: 'restful request2',
                        message: 'success'
                    })
                    done();
                })
            })
        })
    })
}) 
