# DS4H_GAMES 3D - TRON FEVER - Ralph EL CHALFOUN

Je viens de créer un jeu pour un cours en Master en informatique.

Lien direct vers le jeu via HEROKU: https://tronfever.herokuapp.com/

Vous trouverez ici le développement de mon jeu 3D appelé TronFever inspiré du film TRON, c'est un jeu de style SNAKE, le mode multijoueur est disponible.

Règle du jeu:
- Votre Tron (moto) se déplace toute seule
- Quand elle roule, elle crée des murs derrière elle, sauf lors d'un saut
- En utilisant «Q» et «D» (ou les flèches directionnelles «GAUCHE» et «DROITE»), vous pouvez tourner à gauche et à droite
- La touche «ESPACE» permet JUMP (5 secondes de temps de recharge, 1 seconde de durée)
- La touche «S» permet le FREINAGE (7 secondes de recharge, 3 secondes de durée)
- La touche 'Z' vous permet de tirer un "missile" et de détruire tous les murs sur son chemin (10 secondes de recharge, instantané)

BUT: 
- durer le plus longtemps dans le jeu sans heurter un mur ou toucher les bords de la MAP, et également obtenir le maximum de "BONUS" (étoiles).

PRECISIONS DES REGLES:
- les missiles sont personnels et leur mur et uniquement de détruire les murs pour vous crée un chemin, cela n'affecte en rien les adversaire ni les murs présent chez eux.
- cette version du jeu ne possède pas l'assetManager, malheuresement les joueurs enemis ne seront pas visible en temps que moto mais un objet moins complexe, cela accelère le temps de chargement.
- au début avant d'entrer son pseudo vous pouvez activer ou désactiver des affichages, en cas de faible FPS, préférez désactiver certains affichages.
- en multi-joueurs, si un joueur perds il se téléporte en hauteur au centre de la MAP, et il devra attendre que les autres perdent également.
- si des problèmes surviennent sur Heroku, n'hésitez pas à le tester en local, la version Heroku n'est pas encore optimisé, mais en soit "fonctionne", dans ce cas il faudra peut être faire cette manipulation : 
  - supprimez le dossier node_module 
  - tapez "npm install express" puis "npm install socket.io", puis executez node server.js et ouvrez localhost:8082

(veuillez actualiser la page en cas de "LAG")

N'hésitez pas à donner votre avis ou / et conseil.

Have Fun 
