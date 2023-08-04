package main

import (
	"copuchat/pkg/pb"
	"log"
)

func main() {
	if err := pb.NewApp().Start(); err != nil {
		log.Fatal(err)
	}
}
