---
layout: doc
rfc: 5
date: 2022-09-15
title: WebSocket based comms protocol
authors:
- agusaldasoro
- hugoarregui
- marianogoldman
- menduz
status: DRAFT
---

# Abstract

This document describes the minimum protocol for WebSocket/TCP based protocols.

## Wire protocol

Protocol messages are serialized using protocolbuffers, this document also uses the protobuf language to specify the schemas.

All messages are assumed to be broadcasted to all peers at all times. That is, there are no one-to-one messages in any topology. As a side note, optimizations on top of this protocol are possible, an example is Archipelago (ADR) which connects peers all-to-all in a island-based topology to optimize resource allocations based on phyisical (in-world) location.

```protobuf
syntax = "proto3";

message WsWelcome {
  uint32 alias = 1;
  map<uint32, string> peer_identities = 2;
}

message WsPeerJoin {
  uint32 alias = 1;
  string address = 2;
}

message WsPeerLeave {
  uint32 alias = 1;
}

message WsPeerUpdate {
  uint32 from_alias = 1;
  bytes body = 2;
}

message WsChallengeRequired {
  string challenge_to_sign = 1;
  bool already_connected = 2;
}

message WsSignedChallenge {
  string auth_chain_json = 1;
}

message WsIdentification {
  string address = 1;
}

message WsKicked {}

message WsPacket {
  oneof message {
    // direction: server->client
    WsWelcome welcome_message = 1;
    // direction: server->client
    WsPeerJoin peer_join_message = 2;
    // direction: both ways
    WsPeerUpdate peer_update_message = 3;
    // direction: server->client
    WsChallengeRequired challenge_message = 4;
    // direction: client->server
    WsSignedChallenge signed_challenge_for_server = 5;
    // direction: server->client
    WsPeerLeave peer_leave_message = 6;
    // direction: client->server
    WsIdentification peer_identification = 7;
    // direction: server->client
    WsKicked peer_kicked = 8;
  }
}
```
