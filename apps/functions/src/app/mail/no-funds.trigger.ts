import { Player } from '@f2020/data';
import { log } from 'firebase-functions/logger';
import { sendMail } from '../../lib';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

const mailbody = (player: Player) =>
  `<h3>Hej ${player.displayName}</h3>
    <div> 
    <p> Din balance i f2020 spillet er nu nede på ${player.balance}, du kan derfor ikke lægge et bud ind på næste race </br></p>
    <p> Men du kan overfører penge via MobilePay til F1emming på 28 71 22 34</p>
    </div>     
                  
    Wroouumm,<br/>
    F1emming`;

export const nofundsTrigger = onDocumentUpdated('players/{userId}', async event => {
  const player: Player = event.data.after.data() as Player;
  if ((player.balance || 0) - 20 < -100) {
    log('player', player.displayName, 'has insufficient founds for next race');
    return sendMail(player.email, 'Du kan ikke spille mere', mailbody(player)).then((msg) => {
      log(`sendMail result :(${msg})`);
    });
  }
  return null;
});
