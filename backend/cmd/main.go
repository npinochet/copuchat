package main

import (
	"copuchat/internal/redis"
	"copuchat/pkg/pb"
	"fmt"
	"log"
)

func main() {
	fmt.Println(redis.GetActiveMembers("test"))

	return
	if err := pb.NewApp().Start(); err != nil {
		log.Fatal(err)
	}
}
