import { Player } from '@f2020/data';
import { Change, EventContext, region } from 'firebase-functions/v1';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { sendMail } from '../../lib';
import { log } from 'firebase-functions/logger';
;


const mailbody = (player: Player) =>
  `<h3>Hej ${player.displayName}</h3>
    <div> 
    <p> Velkommen til F1 2020 Betting - Din betting konto er nu oprettet, og du kan nu spille med i næste F1 løb</br></p>
    <p> Du kan overfører penge via MobilePay til F1emming på <a href="https://www.mobilepay.dk/erhverv/betalingslink/betalingslink-svar?phone=28712234&comment=F1%20Betting">28 71 22 34</a></p>
    </div>     
                  
    Wroouumm,<br/>
    F1emming`;

export const WelcomeMailTrigger = region('europe-west1').firestore.document('players/{userId}')
  .onUpdate(async (change: Change<DocumentSnapshot>, context: EventContext) => {
    const before: Player = change.before.data() as Player;
    const after: Player = change.after.data() as Player;
    if (before.roles?.includes('anonymous') && after.roles?.includes('player')) {
      log('player', after.displayName, 'Is now approved - lets send a welcome mail');
      return sendMail(after.email, 'Velkommen til F1 2020 Betting', mailbody(after)).then((msg) => {
        log(`sendMail result :(${msg})`);
      });
    }
    return null;
  });    