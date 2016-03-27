import tornado.ioloop
import tornado.web
import tornado.escape
import gene_ann

class MainHandler(tornado.web.RequestHandler):
    def get(self):    	
    	callbackFunc = ""
        if("callback" in self.request.arguments):
            callbackFunc = self.request.arguments["callback"][0]
            callbackFunc = str(callbackFunc)


        self.set_header('Content-Type', 'application/javascript')
	ret = []

	for name in self.request.arguments["id[]"]:
		path = '../samples/' + name
		content = open(path, "r")
		ret.append(content.read())
        self.write("{jsfunc}({json});".format(jsfunc=callbackFunc, json=tornado.escape.json_encode({"content": ret})))
        self.finish()

def make_app():
    return tornado.web.Application([
        (r"/", MainHandler),
    ])

if __name__ == "__main__":
    app = make_app()
    app.listen(8888)
    tornado.ioloop.IOLoop.current().start()
