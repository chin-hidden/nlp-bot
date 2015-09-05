// jshint devel:true
import DISPATCHER from "./pubsub";
import {parser} from "./parser";
import humanInterface from "./human-interface";

parser.parse("mua 10k VND gia 12k");

humanInterface.init();
