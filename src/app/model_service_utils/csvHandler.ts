import { NodeStoreService } from '../model_service_utils/node-store';
import { NodeDataModel } from '../model_service_utils/node-data.model';

export class CsvHandler{

    constructor(private nodeStoreService: NodeStoreService) { }
    /**
     * Use node map to write a CSV file and trigger download
     */
    writeCsv(){
      //create a list of header by getting the keys of hte node object
      // Get node with id 0 via the service
      const node0 = this.nodeStoreService.getNodeSnapshot(0);
      
      // Get headers (property names) from node0, or an empty array if not found
      const headers = node0 ? Object.keys(node0) : [];
      //conver teh map of objet to a list of object
      const nodeArray = this.nodeStoreService.getCurrentNodesArray();
      /*
      {\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\n",\n"text\":\n"qqqq\"}]}]}
      */
        const csvRows = [
        headers.join(','), // ligne d'entête
        ...nodeArray.map(node =>
          headers.map(header =>{         
            if(header==='text'){
              //console.log(node[header] ?? '');
              //console.log(btoa(unescape(encodeURIComponent(node[header] ?? ''))))
              //console.log(decodeURIComponent(escape(atob(btoa(unescape(encodeURIComponent(node[header] ?? '')))))))
              return btoa(unescape(encodeURIComponent(node[header] ?? ''))); //encoding base 64 eviter prb avec les escape char a la lecture 
            }else{
              return JSON.stringify(node[header] ?? '')
            }
            
          }).join(',') // ligne de données pour chaque noeud
        )
      ];
      //id,parentNodeId,x,y,width,height,title,color,text
      csvRows.forEach(e=> console.log(e))
    
      const csvString = csvRows.join('\n');
      //console.log(nodeArray)
      
      // Création d'un Blob contenant le CSV
      const blob = new Blob([csvString], { type: 'text/csv' });
    
      // Création d'une URL pour ce Blob
      const url = URL.createObjectURL(blob);
      //creation NOM DE FICHIER
      // Récupère la date actuelle
      const now = new Date();
    
      // Formate la date yyyy-MM-dd
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0'); // mois de 0 à 11
      const day = String(now.getDate()).padStart(2, '0');
    
      // Formate l'heureMinute hhmm
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
    
    
      // Compose le nom du fichier (sans caractères interdits comme /)
      const fileName = `OmniMap_${year}-${month}-${day}_${hours}:${minutes}.csv`;
      //FIN CREA NOM FICHIER
      // Création d'un lien pour le téléchargement
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', fileName);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    
      URL.revokeObjectURL(url);
    }

    readCsvFile(file: File) {
      const reader = new FileReader();
      //console.log('readCsvFile before .onload')
      reader.onload = () => {
        //console.log('readCsvFile inside .onload')
        const csvText = reader.result as string;
        const lines = csvText.split('\n');  //CSV text string into an array of lines
        this.nodeStoreService.clearAll();
        this.csvToMapWithHeader(lines)
        
      }
      reader.readAsText(file);
      reader.onerror = () => console.error('File reading error', reader.error);
      reader.onabort = () => console.warn('File reading aborted');
    }
    
    csvToMapWithHeader(lines: string[]) {
    
      if (lines.length === 0){console.log('csvToMapWithHeader - no lines'); return ;};
      const header = lines[0].split(','); // Get column names from first line
    
      //get header index and return the string at this index for the given line
      function getValue(columns: string[], name: string): string | undefined {
        const index = header.indexOf(name);
        //console.log(columns[index])
        if (index === -1) return undefined;
        //if (name === 'text')console.log('getValue',stripQuotes(columns[index]))
        return stripQuotes(columns[index]);
      }
    
      function stripQuotes(value: string): string {
        if (!value) return value;
        if (value.startsWith('"') && value.endsWith('"')) {
          return value.slice(1, -1);
        }     
        return value;
      }
    
      for (let i = 1; i < lines.length; i++) {
        const nodeIValues = lines[i].split(',');
    
        const idStr = getValue(nodeIValues, 'id');
        if (!idStr){
          //console.log('line '+i+' id is invalid-skip')
          continue;
        } 
        const nodeI: NodeDataModel = this.nodeStoreService.createAddAndReturnNewNode({
          id: Number(idStr),
          parentNodeId: Number(getValue(nodeIValues, 'parentNodeId')),
          x: Number(getValue(nodeIValues, 'x')),
          y: Number(getValue(nodeIValues, 'y')),
          width: Number(getValue(nodeIValues, 'width')),
          height: Number(getValue(nodeIValues, 'height')),
          title: getValue(nodeIValues, 'title') || '',
          color: getValue(nodeIValues, 'color') || '',
          text: this.decodeTextCell(getValue(nodeIValues, 'text'))
        })
        console.log('node.text apres lecture csv',nodeI.text)
        this.nodeStoreService.upsertNode(nodeI);
      }
    }
    
    decodeTextCell(raw: string | undefined): string {
      const v = raw ? raw.trim() : '';
      console.log('raw string to decode',raw)
      if (!v) return '';            // cellule vide → texte vide
    
      try {
        return decodeURIComponent(escape(atob(v)));
      } catch {
        console.warn('Invalid base64 text cell:', v);
        return '';
      }
    }


}
