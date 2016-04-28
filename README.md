# TEA. Transposable Elements Atlas

## Demo

Check out a working demo here [http://te-atlas.ga](http://te-atlas.ga)

![Detailed view of the chromosome](http://dev.mazepa.us/tea/media/sc1.png)

## How To Install

### Binding sites data

Download

~~~
mkdir bind && cd bind
HOST="http://hgdownload.cse.ucsc.edu/gbdb/hg38/bbi/wgEncodeReg"
wget -np -nH --cut-dirs 6 -r -A "*.bigWig" $HOST/wgEncodeRegMarkH3k27ac/
wget -np -nH --cut-dirs 6 -r -A "*.bigWig" $HOST/wgEncodeRegMarkH3k4me3/
wget -np -nH --cut-dirs 6 -r -A "*.bigWig" $HOST/wgEncodeRegMarkH3k4me1/
~~~

Convert bigWig to BedGraph

~~~
wget http://hgdownload.cse.ucsc.edu/admin/exe/linux.x86_64/bigWigToBedGraph
chmod +x bigWigToBedGraph
E=$(ls *.bigWig)
for i in $E; do ./bigWigToBedGraph $i $i.wig; done
~~~

Convert BedGraph to SQL && Import

~~~
wget http://dev.mazepa.us/tea/app/chipseq/tables.sql
wget http://dev.mazepa.us/tea/app/chipseq/wigtosql
chmod +x wigtosql
T=0; for i in $(ls *27ac*.bed); do ./wigtosql $i $T 'bind27ac_' >> tables.sql; let T=($T+1); done
T=0; for i in $(ls *4me1*.bed); do ./wigtosql $i $T 'bind4me1_' >> tables.sql; let T=($T+1); done
T=0; for i in $(ls *4me3*.bed); do ./wigtosql $i $T 'bind4me3_' >> tables.sql; let T=($T+1); done

mysql -u 'user' -p 'table' < tables.sql
~~~


