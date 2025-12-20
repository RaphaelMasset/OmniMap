import { NodeStoreService } from '../model_service_utils/node-store';
import { NodeDataModel } from '../model_service_utils/node-data.model';

export class CsvHandler{

  node0! :NodeDataModel;

    constructor(private nodeStoreService: NodeStoreService) {
      this.node0 = this.nodeStoreService.originNode;
     }
    /**
     * Use node map to write a CSV file and trigger download
     */
    writeCsv(){
      // Get headers (property names) from node0, or an empty array if not found
      const headers = this.node0 ? Object.keys(this.node0) : [];
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
      reader.onload = () => {
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
      const header = lines[0].split(','); 

      function getValue(columns: string[], name: string): string | undefined {
        const index = header.indexOf(name);
        if (index === -1) return undefined;
        const value = columns[index]
        if (value.startsWith('"') && value.endsWith('"')) {
          return value.slice(1, -1);
        }     
        return value;
      }
    
      for (let i = 1; i < lines.length; i++) {
        const nodeIValues = lines[i].split(',');

        const protoNode: Partial<NodeDataModel> = Object.fromEntries(
          header.map(k => {
            const raw = getValue(nodeIValues, k);
            if (!raw) return [k, undefined];
        
            const protoVal = this.node0[k as keyof NodeDataModel];
        
            if (k === 'text') return [k, this.decodeTextCell(raw)];
            if (typeof protoVal === 'number') return [k, Number(raw)];
            if (typeof protoVal === 'boolean') return [k, raw === 'true'];
            if (typeof protoVal === 'string') {
              try {
                return [k, JSON.parse(raw)]; // removes extra quotes/slashes
              } catch {
                return [k, raw];
              }
            }
            return [k, raw];
          })
        );
        const nodeI2: NodeDataModel =this.nodeStoreService.createAddAndReturnNewNode(protoNode as NodeDataModel);    
      }
    }

    decodeTextCell(raw: string | undefined): string {
      const v = raw ? raw.trim() : '';
      if (!v) return ''; // cellule vide → texte vide
    
      try {
        return decodeURIComponent(escape(atob(v)));
      } catch {
        console.warn('Invalid base64 text cell:', v);
        return '';
      }
    }
}
