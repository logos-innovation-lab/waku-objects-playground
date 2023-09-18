#!/bin/sh

user="0x9B16da459b7EA266787D5beCDB12DD05854A6704"

bot1="0x269a16a015287D660Dc7C0F60dE3e0BF18111550"
bot1_name="WendyBot2"
bot1_avatar="QmTJDir3UkoxEy1Mze1fbSjNz9aapT4A1staTobSa76zCX"

bot2="0xAc0fDf1E1A6bbBaE2E7D332218b3a211C905eBec"
bot2_name="WendyTest"
bot2_avatar="QmYtPe54iHBRZvhRMJFrsmEUKBa7HD7iXpcxWH3975vKVo"

group=cde2cf96d7aaa20a561956fec868bb3cbd737a85b29417fc3642b7f922321c98
group_name="BotParty"
group_avatar="QmUkzzteHqVkU1pV9ncZY1P6ipNH2MQfmhPJoSqEYfCBSV"

pnpm cli waku set-profile "$bot1" "$bot1_name" "$bot1_avatar"
pnpm cli waku set-profile "$bot2" "$bot2_name" "$bot2_avatar"

pnpm cli waku send "$bot1" "$user" "hello from $bot1_name"
pnpm cli waku send "$bot2" "$user" "hello from $bot2_name"

pnpm cli waku set-group-chat "$group" "$group_name" "$group_avatar" "$user" "$bot1" "$bot2"

pnpm cli waku invite "$user" "$bot1" "$group"
pnpm cli waku invite "$user" "$bot2" "$group"

# pnpm cli waku send "$bot1" "$group" "@$bot2 are you there?"
