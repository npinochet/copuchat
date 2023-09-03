type WebSocketEvent<Type, Data> = {
  type: Type;
  data: Data;
};

export type ChatEvent =
  | WebSocketEvent<"Message", Message>
  | WebSocketEvent<"Preview", LinkPreview>;

export type WebSocketResponse =
  | ChatEvent
  | WebSocketEvent<"Messages", Message[]>
  | WebSocketEvent<"Topic", string>
  | WebSocketEvent<"Error", string>
  | null;

export type RoomPreview = {
  name: string;
  room: string;
  activeUsersLength: number;
};

export type Message = {
  userName: string;
  text: string;
  timestamp: number;
};

export type LinkPreview = {
  url: string;
  title: string;
  description: string;
  site_name: string;
  images: PreviewImage[] | null;
};

export type PreviewImage = {
  url: string;
  secure_url: string;
  type: string;
  width: number;
  height: number;
};

/*
// github.com
{
  "url": "https://github.com/",
  "title": "GitHub: Let’s build from here",
  "description": "GitHub is where over 100 million developers shape the future of software, together. Contribute to the open source community, manage your Git repositories, review code like a pro, track bugs and fea...",
  "site_name": "GitHub",
  "images": [
    {
      "url": "https://github.githubassets.com/images/modules/site/social-cards/campaign-social.png",
      "secure_url": "",
      "type": "image/png",
      "width": 1200,
      "height": 630
    }
  ]
}


// love2d.org
{
  "type": "",
  "url": "",
  "title": "",
  "description": "",
  "determiner": "",
  "site_name": "",
  "locale": "",
  "locales_alternate": null,
  "images": null,
  "audios": null,
  "videos": null
}
*/
