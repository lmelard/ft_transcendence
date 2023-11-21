import baseURL, { frontURL } from '../../utils/baseURL';

/* 
** ********************************************************************************
** all public channels
** ********************************************************************************
*/
export async function fetchPublicChannels() {  
  // console.log("Debut fonction fetchPublicChannels");
  try {
    const response = await fetch (baseURL + '/chat/publicChannels', {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching all public channels " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** all protected channels
** ********************************************************************************
*/
export async function fetchProtectedChannels() {  
  // console.log("Debut fonction fetchProtectedChannels");
  try {
    const response = await fetch (baseURL + '/chat/protectedChannels', {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching all protected channels " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** all private channels
** ********************************************************************************
*/
export async function fetchPrivateChannels() {  
  // console.log("Debut fonction fetchPrivateChannels");
  try {
    const response = await fetch (baseURL + '/chat/privateChannels', {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching all private channels " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** user's DMs
** ********************************************************************************
*/
export async function fetchUserDMs(userId:string) {  
  // console.log("Debut fonction fetchUserDMs");
  try {
    const response = await fetch (baseURL + '/chat/userDMs?userId=' + userId, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching user's DMs " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** user protected channels
** ********************************************************************************
*/
export async function fetchUserProtectedChannels(userId:string) {  
  // console.log("Debut fonction fetchUserProtectedChannels");
  try {
    const response = await fetch (baseURL + '/chat/userProtectedChannels?userId=' + userId, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching user protected channels " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** all private channels
** ********************************************************************************
*/
export async function fetchUserPrivateChannels(userId:string) {  
  // console.log("Debut fonction fetchUserPrivateChannels");
  try {
    const response = await fetch (baseURL + '/chat/userPrivateChannels?userId=' + userId, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching user private channels " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** user's channels
** ********************************************************************************
*/
export async function fetchUserChannels(userId:string) {  
  // console.log("Debut fonction fetchUserChannels");
  try {
    const response = await fetch (baseURL + '/chat/userChannels?userId=' + userId, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching user's channels " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** selected channel
** ********************************************************************************
*/
export async function fetchSelectedChannel(channelID:string) {  
  // console.log("Debut fonction fetchSelectedChannel");
  try {
    const response = await fetch (baseURL + '/chat/channelDetails?channelId=' + channelID, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching selected channel " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** channel members
** ********************************************************************************
*/
export async function fetchChannelMembers(channelID:string) {  
  // console.log("Debut fonction fetchChannelMembers");
  try {
    const response = await fetch (baseURL + '/chat/channelMembers?channelId=' + channelID, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching channel members " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** channel administrators
** ********************************************************************************
*/
export async function fetchChannelAdmins(channelID:string) {  
  // console.log("Debut fonction fetchChannelAdmins");
  try {
    const response = await fetch (baseURL + '/chat/channelAdmins?channelId=' + channelID, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching channel administrators " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** channel invited
** ********************************************************************************
*/
export async function fetchChannelInvited(channelID:string) {  
  // console.log("Debut fonction fetchChannelInvited");
  try {
    const response = await fetch (baseURL + '/chat/channelInvited?channelId=' + channelID, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching channel invited " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** channel banned
** ********************************************************************************
*/
export async function fetchChannelBanned(channelID:string) {  
  // console.log("Debut fonction fetchChannelBanned");
  try {
    const response = await fetch (baseURL + '/chat/channelBanned?channelId=' + channelID, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching channel banned " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** channel muted
** ********************************************************************************
*/
export async function fetchChannelMuted(channelID:string) {  
  // console.log("Debut fonction fetchChannelMuted");
  try {
    const response = await fetch (baseURL + '/chat/channelMuted?channelId=' + channelID, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching channel muted " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** channel messages
** ********************************************************************************
*/
export async function fetchChannelMessages(channelName:string, userId: string) {
  // console.log("Debut fonction fetchChannelMessages");
  try {
    const response = await fetch(baseURL + '/chat/channelMessages?channelName=' + channelName + '&userId=' + userId, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true)
      return response.json();
    throw new Error ("Error fetching channel messages " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** admin-able ;-) players
** ********************************************************************************
*/
export async function fetchAdminAblePlayers(channelID:string) {  
  // console.log("Debut fonction fetchAdminAblePlayers");
  try {
    const response = await fetch (baseURL + '/chat/channelAdminables?channelId=' + channelID, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching admin-able ;-) players " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** un-admin-able ;-) players
** ********************************************************************************
*/
export async function fetchUnadminAblePlayers(channelID:string) {  
  // console.log("Debut fonction fetchUnadminAblePlayers");
  try {
    const response = await fetch (baseURL + '/chat/channelUnadminables?channelId=' + channelID, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching un-admin-able ;-) players " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** invit-able ;-) players
** ********************************************************************************
*/
export async function fetchInvitablePlayers(channelID:string) {  
  // console.log("Debut fonction fetchInvitablePlayers");
  try {
    const response = await fetch (baseURL + '/chat/channelInvitables?channelId=' + channelID, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching invit-able ;-) players " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** bannable players
** ********************************************************************************
*/
export async function fetchBannablePlayers(channelID:string) {  
  // console.log("Debut fonction fetchBannablePlayers");
  try {
    const response = await fetch (baseURL + '/chat/channelBannables?channelId=' + channelID, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching bannable ;-) players " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** mutable players
** ********************************************************************************
*/
export async function fetchMutablePlayers(channelID:string) {  
  // console.log("Debut fonction fetchMutablePlayers");
  try {
    const response = await fetch (baseURL + '/chat/channelMutables?channelId=' + channelID, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching mutable ;-) players " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** kickable players
** ********************************************************************************
*/
export async function fetchKickablePlayers(channelID:string) {  
  // console.log("Debut fonction fetchKickablePlayers");
  try {
    const response = await fetch (baseURL + '/chat/channelKickables?channelId=' + channelID, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching kickable ;-) players " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** DMable players
** ********************************************************************************
*/
export async function fetchDMablePlayers(userId:string) {  
  // console.log("Debut fonction fetchDMablePlayers");
  try {
    const response = await fetch (baseURL + '/chat/userDMables?userId=' + userId, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching DMable ;-) players " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** user's new messages
** ********************************************************************************
*/
export async function fetchUserNewMessages(userId:string) {  
  // console.log("Debut fonction fetchUserNewMessages");
  try {
    const response = await fetch (baseURL + '/chat/channelsNewMessages?userId=' + userId, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching user's new messages " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** user's friend requests
** ********************************************************************************
*/
export async function fetchUserFriendRequests() {  
  // console.log("Debut fonction fetchUserFriendRequests");
  try {
    const response = await fetch (baseURL + '/user/userFriendRequests', {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching user's friend requests " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** user's details
** ********************************************************************************
*/
export async function fetchUserDetails() {  
  // console.log("Debut fonction fetchUserDetails");
  try {
    const response = await fetch (baseURL + '/user/me', {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching user's details " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

/* 
** ********************************************************************************
** user's black list
** ********************************************************************************
*/
export async function fetchUserBlackList() {  
  // console.log("Debut fonction fetchUserBlackList");
  try {
    const response = await fetch (baseURL + '/user/blockedPlayers', {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        'Access-Control-Allow-Origin':  frontURL,
      },
    });
    if (response.ok === true) 
      return response.json();
    throw new Error ("Error fetching user's black list " + response.status + " " + response.statusText);
  } catch (error) {
    throw error;
  }
}

