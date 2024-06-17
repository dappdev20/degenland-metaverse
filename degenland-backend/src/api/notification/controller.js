
const Notification = require('../../models/Notification');

exports.getNotification = async (req_, res_) => {
  console.log("------getNotification - 1 ----", req_.query);

  const g_accountId = req_.query.accountId;

  const g_notificationList = await Notification.find({ accountId: g_accountId, state: 'unread' });
  console.log("---------getNotification - 2 : -------", g_notificationList);

  const g_declined_notificationList = await Notification.find({ 'playerInfo.accountId': g_accountId, state: 'declined' });
  console.log("Get declined notification", g_declined_notificationList);

  const g_accepted_notificationList = await Notification.find({ 'playerInfo.accountId': g_accountId, state: 'accepted' });
  console.log("Get accepted notification", g_accepted_notificationList);

  const notiList = g_notificationList.concat(g_declined_notificationList);
  const resData = notiList.concat(g_accepted_notificationList);
  if (!resData)
    return res_.send({ result: true, data: resData, message: "No notification" });

  return res_.send({ result: true, data: resData });
}

exports.getInviteState = async (req_, res_) => {
  console.log("------getNotification - 1 ----", req_.query);

  const myAccountId = req_.query.myAccountId;
  const otherAccountId = req_.query.otherAccountId;

  const resData = await Notification.find({ alertType: 'invite friend', accountId: otherAccountId, 'playerInfo.accountId': myAccountId, state: 'unread' });

  if (resData.length == 0)
    return res_.send({ result: false });

  return res_.send({ result: true });
}

exports.setRead = async (req_, res_) => {
  console.log("------setRead - 1 ----", req_.body);

  const g_id1 = req_.body.id1;
  const g_id2 = req_.body.id2;
  const g_state = req_.body.state;

  // await Notification.findOneAndUpdate(
  //   { accountId: g_id1, 'playerInfo.accountId': g_id2, state: g_state },
  //   { state: 'read' }
  // );
  await Notification.findOneAndDelete(
    { accountId: g_id1, 'playerInfo.accountId': g_id2, state: g_state }
  );

  return res_.send({ result: true});
}
