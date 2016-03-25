#!/usr/bin/python

def contruct_gene_ann():
	d = []
	for i in range(0, 24):
		d.append([])

	f = open("gene", "r")
	for line in f:
		line = line.split()
		line[1] = line[1].replace("chr", "")
		if line[1] == "X" :
			line[1] = "23"
		if line[1] == "Y" :
			line[1] = "24"
	
		if unicode(line[1]).isnumeric() :
			line[1] = int(line[1]) - 1
			line[6] = line[6].split(",")
			del line[6][len(line[6])-1]
			line[7] = line[7].split(",")
			del line[7][len(line[7])-1]
	
			c = {
				"name": [line[0], line[8]],
				"strand": line[2],
				"start": int(line[3]),
				"end": int(line[4]),
				"exon": [line[6], line[7]]
			}
		
			has = 0
			for child in d[line[1]]:
				if int(line[3]) < child["end"]:
					if int(line[4]) > child["end"]:
						child["end"] = int(line[4])
					child["child"].append(c)
					has = 1
					break
	
			if has == 0 :
				child = {
					"start": int(line[3]),
					"end": int(line[4]),
					"child": [c]
				}
				d[line[1]].append(child)

	f.close()
	print "Ready!"
	return d
