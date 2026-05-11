export interface Friend {
  name: string
  description: string
  url: string
  avatar?: string
}

export const friends: Friend[] = [
  {
    name: '宋太祖 赵匡胤',
    description: '陈桥兵变，黄袍加身，开大宋三百年基业',
    url: 'https://zh.wikipedia.org/wiki/%E5%AE%8B%E5%A4%AA%E7%A5%96',
  },
  {
    name: '宋太宗 赵光义',
    description: '烛影斧声，千古之谜，平定南方统一天下',
    url: 'https://zh.wikipedia.org/wiki/%E5%AE%8B%E5%A4%AA%E5%AE%97',
  },
  {
    name: '宋真宗 赵恒',
    description: '澶渊之盟，换得百年和平，亦崇道教',
    url: 'https://zh.wikipedia.org/wiki/%E5%AE%8B%E7%9C%9F%E5%AE%97',
  },
  {
    name: '宋仁宗 赵祯',
    description: '仁宗盛治，范仲淹、包拯皆出于其朝',
    url: 'https://zh.wikipedia.org/wiki/%E5%AE%8B%E4%BB%81%E5%AE%97',
  },
  {
    name: '宋神宗 赵顼',
    description: '锐意变法，任用王安石推行新政',
    url: 'https://zh.wikipedia.org/wiki/%E5%AE%8B%E7%A5%9E%E5%AE%97',
  },
  {
    name: '宋哲宗 赵煦',
    description: '元祐更化，绍述之政，少年天子志在恢复',
    url: 'https://zh.wikipedia.org/wiki/%E5%AE%8B%E5%93%B2%E5%AE%97',
  },
]

export const voidFriends: Friend[] = [
  {
    name: '宋钦宗 赵桓',
    description: '靖康之变，北狩不归……',
    url: 'https://zh.wikipedia.org/wiki/%E5%AE%8B%E9%92%A6%E5%AE%97',
  },
  {
    name: '宋高宗 赵构',
    description: '南渡偏安，莫须有案，终究是回不去了',
    url: 'https://zh.wikipedia.org/wiki/%E5%AE%8B%E9%AB%98%E5%AE%97',
  },
]
