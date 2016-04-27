import tornado.ioloop
import tornado.web
import tornado.escape
import tornado.httpserver
import struct
import os

chr_len = [0, 1287101697, 1691267844, 1889563403, 2087858962, 2269397221,
			2440203200, 2599549173, 2744687809, 248956422, 382753844,
			517840466, 651115775, 765480103, 872523821, 974515010, 
			1064853355, 1148110796, 1228484081, 1529295226, 1593739393,
			1640449376, 1691267844, 2883082526, 3039123421]

def get_chip_seq(layer, start, end, name):
	chip_seq = {"pos": [], "point": []}
	chip_seq["pos"].append(start)
	chip_seq["pos"].append(end)

	dis = end - start
	f = "/home/ginny/www/data/%s/Bind" % (layer)
	step = 0

	if (dis < 41250):
		f += "25"
		step = 25
	elif (dis < 165000):
		f += "100"
		step = 100
	elif (dis < 1650000):
		f += "1000"
		step = 1000
	elif (dis < 16500000):
		f += "10000"
		step = 10000
	else:
		f += "100000"
		step = 100000

	for i in range(0, 6):
		file_path ="%s.%d.bin" %  (f,i) 
		chip_seq["point"].append([])
		inp = open(file_path, "r")
		prev = int(chr_len[name-1]/step)*12
		x = struct.unpack("H", inp.read(2))
		while x[0] != name:
			prev += 12
			inp.seek(prev)
			x = struct.unpack("H", inp.read(2))

		inp.seek(prev + 4)
		x = struct.unpack("I", inp.read(4))
		while x[0] > 0:
			prev -= 12
			inp.seek(prev + 4) 
			x = struct.unpack("I", inp.read(4))

		max_size = os.path.getsize(file_path)
		for k in range(start, end, step):
			line = int(k/step)
			if line >= 0 & line*12 <= max_size -12:
				inp.seek(prev + line*12 + 8)
				score = struct.unpack("f", inp.read(4))
				chip_seq["point"][i].append(score[0])
			else:			
				chip_seq["point"][i].append(0)
		inp.close()

	return chip_seq

def get_value(id_list, t, layer):
	ret = []
	file_path = "/home/ginny/www/data/%s/Bind100.%s.bin" % (layer, t)

	inp = open(file_path, "r")
	max_size = os.path.getsize(file_path)
	for mem in range(0, len(id_list)):
		idx = id_list[mem].split("-")
		chrs = 0
		if idx[0][3] == 'X':
			chrs = 23
		elif idx[0][3] == 'Y':
			chrs = 24
		else:
			chrs = int(idx[0][3:])
		prev = int(chr_len[chrs-1]/100)*12
		inp.seek(prev)
		x = struct.unpack("H", inp.read(2))
		while x[0] != chrs:
			prev += 12
			inp.seek(prev)
			x = struct.unpack("H", inp.read(2))

		inp.seek(prev + 4)
		x = struct.unpack("I", inp.read(4))
		while x[0] > 0:
			prev -= 12
			inp.seek(prev + 4) 
			x = struct.unpack("I", inp.read(4))

		line = int(int(idx[2])/100)
		if line >= 0 & line*12 <= max_size -12:
			inp.seek(prev + line*12 + 8)
			s = struct.unpack("f", inp.read(4))
			ret.append(s[0])
		else:			
			ret.append(0)
	inp.close()
	return ret

class MainHandler(tornado.web.RequestHandler):
	@tornado.web.asynchronous
	def get(self):    	
		callbackFunc = ""
		if("callback" in self.request.arguments):
			callbackFunc = self.request.arguments["callback"][0]
			callbackFunc = str(callbackFunc)

		self.set_header('Content-Type', 'application/javascript')
		ret = []

		if self.request.arguments["inf"][0] == "file":
			for name in self.request.arguments["id[]"]:
				path = '../samples/' + name
				print path
				content = open(path, "r")
				ret.append(content.read())
		elif self.request.arguments["inf"][0] == "chip_seq":
			ret = get_chip_seq(self.request.arguments["layer"][0], int(self.request.arguments["start"][0]), int(self.request.arguments["end"][0]), int(self.request.arguments["chr"][0]))

		self.write("{jsfunc}({json});".format(jsfunc=callbackFunc, json=tornado.escape.json_encode(ret)))
		self.finish()

	@tornado.web.asynchronous
	def post(self):
		callbackFunc = ""
		if("callback" in self.request.arguments):
			callbackFunc = self.request.arguments["callback"][0]
			callbackFunc = str(callbackFunc)

		self.set_header('Content-Type', 'application/javascript')
		ret = {"score": [], "pos": self.request.arguments["pos"][0]}

		if self.request.arguments["inf"][0] == "filter":
			ret["score"] = get_value(self.request.arguments["id_list[]"], self.request.arguments["type"][0], self.request.arguments["layer"][0])

		self.write("{jsfunc}({json});".format(jsfunc=callbackFunc, json=tornado.escape.json_encode(ret)))
		self.finish()

def make_app():
    return tornado.web.Application([
        (r"/teatlas_ajax", MainHandler),
    ])

if __name__ == "__main__":
    app = make_app()
    server = tornado.httpserver.HTTPServer(app)
    server.bind(8888)
    server.start(8)
    tornado.ioloop.IOLoop.current().start()
